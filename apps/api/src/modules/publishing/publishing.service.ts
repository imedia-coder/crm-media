import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, Prisma, PublicationTargetStatus } from '@prisma/client';
import { TenantPrismaService } from '../../core/tenancy/tenant-prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { CreateTargetDto } from './dto/create-target.dto';
import { ListPublicationsQuery } from './dto/list-publications.query';
import { SchedulePublicationDto } from './dto/schedule-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { UpdateTargetDto } from './dto/update-target.dto';
import { PublisherService } from './publisher.service';

const PUBLICATION_INCLUDE = {
  company: { select: { id: true, name: true } },
  campaign: { select: { id: true, name: true } },
  targets: {
    orderBy: { createdAt: 'asc' },
    include: {
      account: { select: { id: true, network: true, handle: true } },
      attempts: { orderBy: { startedAt: 'desc' } },
    },
  },
} satisfies Prisma.PublicationInclude;

/** Statuts d'une target encore modifiables par l'équipe. */
const EDITABLE_TARGET_STATUSES: PublicationTargetStatus[] = [
  PublicationTargetStatus.DRAFT,
  PublicationTargetStatus.SCHEDULED,
];

@Injectable()
export class PublishingService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly publisher: PublisherService,
  ) {}

  // ---------- Publications ----------

  findAll(query: ListPublicationsQuery) {
    return this.tenantPrisma.client.publication.findMany({
      where: {
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.campaignId ? { campaignId: query.campaignId } : {}),
        ...(query.status ? { status: query.status as ContentStatus } : {}),
      },
      include: PUBLICATION_INCLUDE,
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOneOrThrow(id: string) {
    const publication = await this.tenantPrisma.client.publication.findUnique({
      where: { id },
      include: PUBLICATION_INCLUDE,
    });
    if (!publication) throw new NotFoundException('Publication not found');
    return publication;
  }

  create(dto: CreatePublicationDto) {
    return this.tenantPrisma.client.publication.create({
      data: {
        tenantId: this.tenantPrisma.tenantId,
        companyId: dto.companyId,
        title: dto.title,
        contentItemId: dto.contentItemId,
        campaignId: dto.campaignId,
      },
      include: PUBLICATION_INCLUDE,
    });
  }

  async update(id: string, dto: UpdatePublicationDto) {
    const publication = await this.tenantPrisma.client.publication.findUnique({
      where: { id },
    });
    if (!publication) throw new NotFoundException('Publication not found');
    if (publication.status !== ContentStatus.DRAFT) {
      throw new ConflictException('Only draft publications can be edited');
    }
    return this.tenantPrisma.client.publication.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.contentItemId !== undefined
          ? { contentItemId: dto.contentItemId }
          : {}),
        ...(dto.campaignId !== undefined ? { campaignId: dto.campaignId } : {}),
      },
      include: PUBLICATION_INCLUDE,
    });
  }

  async remove(id: string) {
    const publication = await this.tenantPrisma.client.publication.findUnique({
      where: { id },
    });
    if (!publication) throw new NotFoundException('Publication not found');
    if (publication.status !== ContentStatus.DRAFT) {
      throw new ConflictException('Only draft publications can be deleted');
    }
    await this.tenantPrisma.client.publication.delete({ where: { id } });
  }

  /**
   * Programme la publication : les cibles `DRAFT` passent `SCHEDULED` avec
   * l'heure demandée. Le `PublishSchedulerService` (tick 30 s) les prendra en
   * charge à l'échéance via le `PublisherService`. Increment 2 : transport =
   * polling SQL + adaptateur de simulation (voir §7.1 et §8 du cahier des
   * charges) ; adaptateurs réseaux réels aux increments suivants.
   */
  async schedule(id: string, dto: SchedulePublicationDto) {
    const publication = await this.tenantPrisma.client.publication.findUnique({
      where: { id },
      include: { targets: true },
    });
    if (!publication) throw new NotFoundException('Publication not found');
    if (publication.status === ContentStatus.PUBLISHED) {
      throw new ConflictException('Publication already published');
    }
    if (publication.targets.length === 0) {
      throw new BadRequestException(
        'Add at least one network target before scheduling',
      );
    }

    const scheduledAt = new Date(dto.scheduledAt);

    await this.tenantPrisma.transaction(async (tx) => {
      await tx.publication.update({
        where: { id },
        data: { status: ContentStatus.SCHEDULED, scheduledAt },
      });
      await tx.publicationTarget.updateMany({
        where: { publicationId: id, status: PublicationTargetStatus.DRAFT },
        data: { status: PublicationTargetStatus.SCHEDULED, scheduledAt },
      });
    });

    return this.findOneOrThrow(id);
  }

  /**
   * « Publier maintenant » : (re)programme toutes les cibles à l'instant même
   * puis les traite en direct, sans attendre le tick du scheduler.
   */
  async publishNow(id: string) {
    const publication = await this.tenantPrisma.client.publication.findUnique({
      where: { id },
      include: { targets: { select: { id: true } } },
    });
    if (!publication) throw new NotFoundException('Publication not found');
    if (publication.targets.length === 0) {
      throw new BadRequestException(
        'Add at least one network target before publishing',
      );
    }

    const now = new Date();
    await this.tenantPrisma.transaction(async (tx) => {
      await tx.publication.update({
        where: { id },
        data: { status: ContentStatus.SCHEDULED, scheduledAt: now },
      });
      await tx.publicationTarget.updateMany({
        where: {
          publicationId: id,
          status: {
            in: [
              PublicationTargetStatus.DRAFT,
              PublicationTargetStatus.SCHEDULED,
              PublicationTargetStatus.ACTION_REQUISE,
              PublicationTargetStatus.FAILED,
            ],
          },
        },
        data: { status: PublicationTargetStatus.SCHEDULED, scheduledAt: now },
      });
    });

    for (const target of publication.targets) {
      await this.publisher.runTargetNow(target.id);
    }
    return this.findOneOrThrow(id);
  }

  /**
   * Parcours "simple" : crée un post pour un client sur les réseaux cochés,
   * puis publie maintenant ou programme. Renvoie la publication + la liste
   * des réseaux ignorés (non connectés pour ce client).
   */
  async createPost(dto: CreatePostDto) {
    const tenantId = this.tenantPrisma.tenantId;
    const networks = [...new Set(dto.networks)];

    const accounts = await this.tenantPrisma.client.socialAccount.findMany({
      where: { companyId: dto.companyId, network: { in: networks } },
    });
    const byNetwork = new Map(accounts.map((a) => [a.network, a]));
    const usable = networks.filter((n) => byNetwork.has(n));
    const skipped = networks.filter((n) => !byNetwork.has(n));

    if (usable.length === 0) {
      throw new BadRequestException(
        'Aucun des réseaux choisis n’est connecté pour ce client.',
      );
    }

    const title = dto.title?.trim() || dto.text?.trim().slice(0, 60) || 'Post';
    const when =
      dto.when === 'schedule' && dto.scheduledAt
        ? new Date(dto.scheduledAt)
        : new Date();

    const publication = await this.tenantPrisma.client.publication.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        title,
        status:
          dto.when === 'schedule'
            ? ContentStatus.SCHEDULED
            : ContentStatus.DRAFT,
        scheduledAt: dto.when === 'schedule' ? when : null,
        targets: {
          create: usable.map((network) => ({
            tenantId,
            accountId: byNetwork.get(network)!.id,
            network,
            caption: dto.text?.trim() || null,
            hashtags: dto.hashtags ?? [],
            mediaIds: dto.mediaIds ?? [],
            status: PublicationTargetStatus.SCHEDULED,
            scheduledAt: when,
          })),
        },
      },
      include: { targets: { select: { id: true } } },
    });

    if (dto.when === 'now') {
      for (const t of publication.targets) {
        await this.publisher.runTargetNow(t.id);
      }
    }

    const full = await this.findOneOrThrow(publication.id);
    return { publication: full, skipped };
  }

  /** Rejoue une seule cible immédiatement (bouton « Réessayer » du pipeline). */
  async runTarget(targetId: string) {
    const target = await this.tenantPrisma.client.publicationTarget.findUnique({
      where: { id: targetId },
      select: { publicationId: true },
    });
    if (!target) throw new NotFoundException('Publication target not found');
    await this.publisher.runTargetNow(targetId);
    return this.findOneOrThrow(target.publicationId);
  }

  // ---------- Targets ----------

  async addTarget(publicationId: string, dto: CreateTargetDto) {
    const publication = await this.tenantPrisma.client.publication.findUnique({
      where: { id: publicationId },
    });
    if (!publication) throw new NotFoundException('Publication not found');

    const account = await this.tenantPrisma.client.socialAccount.findUnique({
      where: { id: dto.accountId },
    });
    if (!account) throw new NotFoundException('Social account not found');
    if (account.companyId !== publication.companyId) {
      throw new BadRequestException(
        'Social account belongs to a different client',
      );
    }
    if (dto.network && dto.network !== account.network) {
      throw new BadRequestException(
        'network does not match the social account',
      );
    }

    try {
      await this.tenantPrisma.client.publicationTarget.create({
        data: {
          tenantId: this.tenantPrisma.tenantId,
          publicationId,
          accountId: account.id,
          network: account.network,
          caption: dto.caption,
          hashtags: dto.hashtags ?? [],
          mediaIds: dto.mediaIds ?? [],
          ...(dto.mode ? { mode: dto.mode } : {}),
        },
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2003') {
        throw new BadRequestException('Invalid accountId');
      }
      throw error;
    }

    return this.findOneOrThrow(publicationId);
  }

  async updateTarget(targetId: string, dto: UpdateTargetDto) {
    const target = await this.tenantPrisma.client.publicationTarget.findUnique({
      where: { id: targetId },
    });
    if (!target) throw new NotFoundException('Publication target not found');
    if (!EDITABLE_TARGET_STATUSES.includes(target.status)) {
      throw new ConflictException(
        `Target can no longer be edited (status ${target.status})`,
      );
    }
    await this.tenantPrisma.client.publicationTarget.update({
      where: { id: targetId },
      data: {
        ...(dto.caption !== undefined ? { caption: dto.caption } : {}),
        ...(dto.hashtags !== undefined ? { hashtags: dto.hashtags } : {}),
        ...(dto.mediaIds !== undefined ? { mediaIds: dto.mediaIds } : {}),
        ...(dto.mode !== undefined ? { mode: dto.mode } : {}),
      },
    });
    return this.findOneOrThrow(target.publicationId);
  }

  async removeTarget(targetId: string) {
    const target = await this.tenantPrisma.client.publicationTarget.findUnique({
      where: { id: targetId },
    });
    if (!target) throw new NotFoundException('Publication target not found');
    await this.tenantPrisma.client.publicationTarget.delete({
      where: { id: targetId },
    });
    return this.findOneOrThrow(target.publicationId);
  }
}
