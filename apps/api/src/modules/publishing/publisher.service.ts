import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PlatformPrismaService } from '../../core/prisma/platform-prisma.service';
import { SocialTokenService } from '../social/social-token.service';
import { AdapterRegistry } from './adapters/adapter-registry';
import { MediaLinkService } from './media-link.service';
import { PublishError } from './adapters/network-adapter';

const MAX_ATTEMPTS = 3;
/** Délai avant la tentative 2, puis avant la 3. */
const RETRY_DELAYS_MS = [30_000, 120_000];
/** Une target coincée en PUBLISHING au-delà de ça est ré-armée (worker mort en cours de route). */
const STALE_PUBLISHING_MINUTES = 10;

/**
 * Cœur du moteur de publication. Tourne hors contexte de requête (cron +
 * déclenchements manuels), donc via PlatformPrismaService (rôle propriétaire,
 * cross-tenant) — c'est l'usage « outillage système » prévu par ce service.
 * Chaque écriture reste filtrée par l'id de la target et porte le tenantId de
 * la ligne elle-même.
 *
 * Le transport est ici un simple polling SQL (`FOR UPDATE SKIP LOCKED`) ;
 * il pourra être remplacé par BullMQ sans toucher à cette logique métier.
 */
@Injectable()
export class PublisherService {
  private readonly logger = new Logger(PublisherService.name);

  constructor(
    private readonly prisma: PlatformPrismaService,
    private readonly adapters: AdapterRegistry,
    private readonly tokens: SocialTokenService,
    private readonly mediaLinks: MediaLinkService,
  ) {}

  /**
   * Réclame atomiquement jusqu'à `limit` targets dues (ou coincées) et les
   * traite. Retourne le nombre de targets traitées.
   */
  async processDueTargets(limit = 20): Promise<number> {
    const claimed = await this.prisma.$queryRaw<{ id: string }[]>`
      UPDATE "publication_targets"
      SET "status" = 'PUBLISHING', "updatedAt" = now()
      WHERE "id" IN (
        SELECT "id" FROM "publication_targets"
        WHERE ("status" = 'SCHEDULED' AND "scheduledAt" IS NOT NULL AND "scheduledAt" <= now())
           OR ("status" = 'PUBLISHING' AND "updatedAt" < now() - make_interval(mins => ${STALE_PUBLISHING_MINUTES}))
        ORDER BY "scheduledAt" ASC NULLS FIRST
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING "id"`;

    for (const { id } of claimed) {
      try {
        await this.processClaimedTarget(id);
      } catch (err) {
        this.logger.error(
          `Traitement de la target ${id} en erreur: ${(err as Error).message}`,
        );
        await this.prisma.publicationTarget
          .update({
            where: { id },
            data: {
              status: 'ACTION_REQUISE',
              lastError: `Erreur interne: ${(err as Error).message}`,
            },
          })
          .catch(() => undefined);
      }
    }
    return claimed.length;
  }

  /**
   * Déclenchement immédiat d'une seule target (bouton « Publier maintenant »
   * ou script de test). L'appelant a déjà vérifié que la target lui appartient.
   */
  async runTargetNow(targetId: string): Promise<void> {
    const target = await this.prisma.publicationTarget.findUnique({
      where: { id: targetId },
      select: { status: true },
    });
    if (!target || target.status === 'PUBLISHING') return;

    await this.prisma.publicationTarget.update({
      where: { id: targetId },
      data: { status: 'PUBLISHING', scheduledAt: new Date() },
    });
    try {
      await this.processClaimedTarget(targetId);
    } catch (err) {
      await this.prisma.publicationTarget
        .update({
          where: { id: targetId },
          data: {
            status: 'ACTION_REQUISE',
            lastError: `Erreur interne: ${(err as Error).message}`,
          },
        })
        .catch(() => undefined);
    }
  }

  // ---------- interne ----------

  private async processClaimedTarget(targetId: string): Promise<void> {
    const target = await this.prisma.publicationTarget.findUnique({
      where: { id: targetId },
      include: { account: { include: { capability: true } } },
    });
    if (!target) return;

    const capability = target.account.capability?.capability ?? 'UNVERIFIED';
    const attemptNumber =
      (await this.prisma.publicationAttempt.count({ where: { targetId } })) + 1;
    const startedAt = new Date();

    // Cas « on ne tente même pas l'appel réseau ».
    if (capability === 'EXPIRED') {
      return this.markActionRequise(
        target.tenantId,
        targetId,
        attemptNumber,
        startedAt,
        'ACCOUNT_EXPIRED',
        'Connexion au réseau expirée — reconnecter le compte.',
      );
    }
    if (
      target.mode === 'MANUAL' ||
      capability === 'MANUAL' ||
      capability === 'UNVERIFIED'
    ) {
      return this.markActionRequise(
        target.tenantId,
        targetId,
        attemptNumber,
        startedAt,
        'MANUAL_REQUIRED',
        'Publication manuelle requise (réseau non audité ou cible en mode manuel).',
      );
    }

    const accessToken = await this.tokens.ensureFreshAccessToken(
      target.account,
    );
    const mediaIds = await this.mediaLinks.resolve(
      target.mediaIds,
      target.tenantId,
    );

    try {
      const result = await this.adapters.for(target.network).publish({
        network: target.network,
        capability,
        attemptNumber,
        caption: target.caption,
        hashtags: target.hashtags,
        mediaIds,
        account: {
          id: target.account.id,
          handle: target.account.handle,
          externalId: target.account.externalId,
          accessToken,
        },
      });

      const providerResponse = result as unknown as Prisma.InputJsonValue;

      if (result.outcome === 'PUBLISHED') {
        await this.prisma.$transaction([
          this.prisma.publicationAttempt.create({
            data: {
              tenantId: target.tenantId,
              targetId,
              attemptNumber,
              outcome: 'OK',
              startedAt,
              finishedAt: new Date(),
              providerResponse,
            },
          }),
          this.prisma.publicationTarget.update({
            where: { id: targetId },
            data: {
              status: 'PUBLISHED',
              externalPostId: result.externalPostId ?? null,
              publishedAt: new Date(),
              lastError: null,
            },
          }),
        ]);
        await this.rollUpPublication(target.publicationId);
        return;
      }

      // DRAFT_CREATED ou MANUAL_REQUIRED : la tentative a réussi, mais il reste
      // une action humaine → ACTION_REQUISE.
      const message =
        result.outcome === 'DRAFT_CREATED'
          ? 'Brouillon créé côté réseau — à finaliser manuellement.'
          : 'Publication manuelle requise.';
      await this.prisma.$transaction([
        this.prisma.publicationAttempt.create({
          data: {
            tenantId: target.tenantId,
            targetId,
            attemptNumber,
            outcome: 'OK',
            startedAt,
            finishedAt: new Date(),
            providerResponse,
          },
        }),
        this.prisma.publicationTarget.update({
          where: { id: targetId },
          data: {
            status: 'ACTION_REQUISE',
            externalPostId: result.externalPostId ?? null,
            lastError: message,
          },
        }),
      ]);
    } catch (err) {
      const publishError = err instanceof PublishError ? err : null;
      const code = publishError?.code ?? 'UNKNOWN';
      const message = (err as Error).message;
      const retryable = publishError?.retryable ?? false;

      // Jeton révoqué / invalide → la capacité du compte passe EXPIRED pour que
      // l'UI propose « Reconnecter » et que le moteur cesse de tenter.
      if (code === 'TOKEN_INVALID') {
        await this.prisma.socialAccountCapability
          .upsert({
            where: { accountId: target.accountId },
            create: {
              tenantId: target.tenantId,
              accountId: target.accountId,
              capability: 'EXPIRED',
              reason: message,
            },
            update: {
              capability: 'EXPIRED',
              reason: message,
              checkedAt: new Date(),
            },
          })
          .catch(() => undefined);
      }

      if (retryable && attemptNumber < MAX_ATTEMPTS) {
        const delayMs =
          RETRY_DELAYS_MS[
            Math.min(attemptNumber - 1, RETRY_DELAYS_MS.length - 1)
          ];
        const nextAt = new Date(Date.now() + delayMs);
        await this.prisma.$transaction([
          this.prisma.publicationAttempt.create({
            data: {
              tenantId: target.tenantId,
              targetId,
              attemptNumber,
              outcome: 'RETRY',
              errorCode: code,
              errorDetail: message,
              startedAt,
              finishedAt: new Date(),
            },
          }),
          this.prisma.publicationTarget.update({
            where: { id: targetId },
            data: {
              status: 'SCHEDULED',
              scheduledAt: nextAt,
              lastError: `Nouvel essai vers ${nextAt.toISOString()} — ${message}`,
            },
          }),
        ]);
        return;
      }

      await this.prisma.$transaction([
        this.prisma.publicationAttempt.create({
          data: {
            tenantId: target.tenantId,
            targetId,
            attemptNumber,
            outcome: 'FAILED',
            errorCode: code,
            errorDetail: message,
            startedAt,
            finishedAt: new Date(),
          },
        }),
        this.prisma.publicationTarget.update({
          where: { id: targetId },
          data: { status: 'FAILED', lastError: message },
        }),
      ]);
    }
  }

  private async markActionRequise(
    tenantId: string,
    targetId: string,
    attemptNumber: number,
    startedAt: Date,
    code: string,
    message: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.publicationAttempt.create({
        data: {
          tenantId,
          targetId,
          attemptNumber,
          outcome: 'FAILED',
          errorCode: code,
          errorDetail: message,
          startedAt,
          finishedAt: new Date(),
        },
      }),
      this.prisma.publicationTarget.update({
        where: { id: targetId },
        data: { status: 'ACTION_REQUISE', lastError: message },
      }),
    ]);
  }

  private async rollUpPublication(publicationId: string): Promise<void> {
    const targets = await this.prisma.publicationTarget.findMany({
      where: { publicationId },
      select: { status: true },
    });
    if (targets.length > 0 && targets.every((t) => t.status === 'PUBLISHED')) {
      await this.prisma.publication.update({
        where: { id: publicationId },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      });
    }
  }
}
