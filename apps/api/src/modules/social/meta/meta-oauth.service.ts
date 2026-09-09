import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SocialNetwork } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PlatformPrismaService } from '../../../core/prisma/platform-prisma.service';
import { TokenCipherService } from '../../../core/crypto/token-cipher.service';

const META_SCOPES = [
  'public_profile',
  'business_management',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
];

export type MetaCallbackResult = {
  status: 'connected' | 'denied' | 'error';
  detail?: string;
  accounts?: number;
};

type StatePayload = { t: string; c: string; n: string; p: 'meta_oauth' };

type GraphPage = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string; username?: string };
};

@Injectable()
export class MetaOAuthService {
  private readonly logger = new Logger(MetaOAuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PlatformPrismaService,
    private readonly cipher: TokenCipherService,
  ) {}

  private get appId() {
    return this.config.get<string>('META_APP_ID');
  }
  private get appSecret() {
    return this.config.get<string>('META_APP_SECRET');
  }
  private get redirectUri() {
    return this.config.get<string>('META_REDIRECT_URI');
  }
  private get graphVersion() {
    return this.config.get<string>('META_GRAPH_VERSION') ?? 'v21.0';
  }
  private get stateSecret() {
    return this.config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-state-secret';
  }
  private get webAppUrl() {
    return this.config.get<string>('WEB_APP_URL') ?? 'http://localhost:3000';
  }

  isConfigured(): boolean {
    return Boolean(this.appId && this.appSecret && this.redirectUri);
  }

  async buildAuthUrl(tenantId: string, companyId: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'Connexion Meta non configurée (META_APP_ID / META_APP_SECRET / META_REDIRECT_URI).',
      );
    }
    const state = await this.jwt.signAsync(
      {
        t: tenantId,
        c: companyId,
        n: randomUUID(),
        p: 'meta_oauth',
      } satisfies StatePayload,
      { secret: this.stateSecret, expiresIn: '10m' },
    );
    const params = new URLSearchParams({
      client_id: this.appId!,
      redirect_uri: this.redirectUri!,
      response_type: 'code',
      state,
      scope: META_SCOPES.join(','),
    });
    return `https://www.facebook.com/${this.graphVersion}/dialog/oauth?${params.toString()}`;
  }

  async handleCallback(input: {
    code?: string;
    state?: string;
    error?: string;
  }): Promise<MetaCallbackResult> {
    if (input.error) return { status: 'denied', detail: input.error };
    if (!input.code || !input.state)
      return { status: 'error', detail: 'code ou state manquant' };

    let payload: StatePayload;
    try {
      payload = await this.jwt.verifyAsync<StatePayload>(input.state, {
        secret: this.stateSecret,
      });
    } catch {
      return { status: 'error', detail: 'state invalide ou expiré' };
    }
    if (payload.p !== 'meta_oauth')
      return { status: 'error', detail: 'state invalide' };

    try {
      const shortToken = await this.exchangeCode(input.code);
      const long = await this.exchangeForLongLived(shortToken);
      const pages = await this.listPages(long.access_token);
      if (pages.length === 0) {
        return {
          status: 'error',
          detail:
            'Aucune Page Facebook administrée par ce compte. Reliez une Page à l’app.',
        };
      }
      const tokenExpiresAt = long.expires_in
        ? new Date(Date.now() + long.expires_in * 1000)
        : null;

      let count = 0;
      const fbPage = pages[0];
      await this.upsertAccount({
        tenantId: payload.t,
        companyId: payload.c,
        network: SocialNetwork.FACEBOOK,
        externalId: fbPage.id,
        handle: fbPage.name,
        rawToken: fbPage.access_token,
        tokenExpiresAt,
      });
      count += 1;

      const igPage = pages.find((p) => p.instagram_business_account?.id);
      if (igPage?.instagram_business_account) {
        await this.upsertAccount({
          tenantId: payload.t,
          companyId: payload.c,
          network: SocialNetwork.INSTAGRAM,
          externalId: igPage.instagram_business_account.id,
          handle: igPage.instagram_business_account.username ?? null,
          rawToken: igPage.access_token,
          tokenExpiresAt,
        });
        count += 1;
      }

      if (pages.length > 1) {
        this.logger.warn(
          `Compte ${payload.c} : ${pages.length} Pages trouvées, seule la première a été connectée.`,
        );
      }
      return { status: 'connected', accounts: count };
    } catch (err) {
      this.logger.error(`Callback Meta en échec: ${(err as Error).message}`);
      return { status: 'error', detail: (err as Error).message };
    }
  }

  resultRedirectUrl(result: MetaCallbackResult): string {
    const params = new URLSearchParams({
      social: 'meta',
      status: result.status,
    });
    if (result.accounts) params.set('accounts', String(result.accounts));
    if (result.detail && result.status !== 'connected')
      params.set('detail', result.detail);
    return `${this.webAppUrl}/dashboard/social/accounts?${params.toString()}`;
  }

  // ---------- Graph API ----------

  private async graphGet<T>(
    path: string,
    params: Record<string, string>,
  ): Promise<T> {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(
      `https://graph.facebook.com/${this.graphVersion}/${path}?${qs}`,
    );
    const json = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok || json.error) {
      const error = json.error as { message?: string } | undefined;
      throw new Error(error?.message ?? `Graph API HTTP ${res.status}`);
    }
    return json as T;
  }

  private async exchangeCode(code: string): Promise<string> {
    const json = await this.graphGet<{ access_token: string }>(
      'oauth/access_token',
      {
        client_id: this.appId!,
        client_secret: this.appSecret!,
        redirect_uri: this.redirectUri!,
        code,
      },
    );
    return json.access_token;
  }

  private async exchangeForLongLived(
    shortToken: string,
  ): Promise<{ access_token: string; expires_in?: number }> {
    return this.graphGet<{ access_token: string; expires_in?: number }>(
      'oauth/access_token',
      {
        grant_type: 'fb_exchange_token',
        client_id: this.appId!,
        client_secret: this.appSecret!,
        fb_exchange_token: shortToken,
      },
    );
  }

  private async listPages(userToken: string): Promise<GraphPage[]> {
    const json = await this.graphGet<{ data: GraphPage[] }>('me/accounts', {
      access_token: userToken,
      fields: 'id,name,access_token,instagram_business_account{id,username}',
      limit: '50',
    });
    return json.data ?? [];
  }

  // ---------- persistance ----------

  private async upsertAccount(p: {
    tenantId: string;
    companyId: string;
    network: SocialNetwork;
    externalId: string;
    handle: string | null;
    rawToken: string;
    tokenExpiresAt: Date | null;
  }): Promise<void> {
    const accessTokenEnc = this.cipher.encrypt(p.rawToken);
    const account = await this.prisma.socialAccount.upsert({
      where: {
        companyId_network: { companyId: p.companyId, network: p.network },
      },
      create: {
        tenantId: p.tenantId,
        companyId: p.companyId,
        network: p.network,
        externalId: p.externalId,
        handle: p.handle,
        accessTokenEnc,
        scopes: META_SCOPES,
        tokenExpiresAt: p.tokenExpiresAt,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
      },
      update: {
        externalId: p.externalId,
        handle: p.handle,
        accessTokenEnc,
        scopes: META_SCOPES,
        tokenExpiresAt: p.tokenExpiresAt,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
      },
    });

    const existing = await this.prisma.socialAccountCapability.findUnique({
      where: { accountId: account.id },
    });
    const devReason =
      'App Meta en mode Développement — basculez la capacité en AUTO_PUBLISH pour publier directement.';
    if (!existing) {
      await this.prisma.socialAccountCapability.create({
        data: {
          tenantId: p.tenantId,
          accountId: account.id,
          capability: 'UNVERIFIED',
          reason: devReason,
        },
      });
    } else if (existing.capability === 'EXPIRED') {
      await this.prisma.socialAccountCapability.update({
        where: { accountId: account.id },
        data: {
          capability: 'UNVERIFIED',
          reason: devReason,
          checkedAt: new Date(),
        },
      });
    } else {
      await this.prisma.socialAccountCapability.update({
        where: { accountId: account.id },
        data: { checkedAt: new Date() },
      });
    }
  }
}
