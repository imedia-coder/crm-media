import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SocialNetwork } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { TokenCipherService } from '../../../core/crypto/token-cipher.service';
import { PlatformPrismaService } from '../../../core/prisma/platform-prisma.service';

const TIKTOK_SCOPES = [
  'user.info.basic',
  'video.upload',
  'video.publish',
  'photo.publish',
];
const AUTH_BASE = 'https://www.tiktok.com/v2/auth/authorize/';
const API_BASE = 'https://open.tiktokapis.com/v2';

export type TikTokCallbackResult = {
  status: 'connected' | 'denied' | 'error';
  detail?: string;
  handle?: string;
};

type StatePayload = { t: string; c: string; n: string; p: 'tiktok_oauth' };

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  open_id: string;
  scope: string;
  error?: string;
  error_description?: string;
};

@Injectable()
export class TikTokOAuthService {
  private readonly logger = new Logger(TikTokOAuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PlatformPrismaService,
    private readonly cipher: TokenCipherService,
  ) {}

  private get clientKey() {
    return this.config.get<string>('TIKTOK_CLIENT_KEY');
  }
  private get clientSecret() {
    return this.config.get<string>('TIKTOK_CLIENT_SECRET');
  }
  private get redirectUri() {
    return this.config.get<string>('TIKTOK_REDIRECT_URI');
  }
  private get stateSecret() {
    return this.config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-state-secret';
  }
  private get webAppUrl() {
    return this.config.get<string>('WEB_APP_URL') ?? 'http://localhost:3000';
  }

  isConfigured(): boolean {
    return Boolean(this.clientKey && this.clientSecret && this.redirectUri);
  }

  async buildAuthUrl(tenantId: string, companyId: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'Connexion TikTok non configurée (TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET / TIKTOK_REDIRECT_URI).',
      );
    }
    const state = await this.jwt.signAsync(
      {
        t: tenantId,
        c: companyId,
        n: randomUUID(),
        p: 'tiktok_oauth',
      } satisfies StatePayload,
      { secret: this.stateSecret, expiresIn: '10m' },
    );
    const params = new URLSearchParams({
      client_key: this.clientKey!,
      response_type: 'code',
      scope: TIKTOK_SCOPES.join(','),
      redirect_uri: this.redirectUri!,
      state,
    });
    return `${AUTH_BASE}?${params.toString()}`;
  }

  async handleCallback(input: {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  }): Promise<TikTokCallbackResult> {
    if (input.error)
      return {
        status: 'denied',
        detail: input.error_description ?? input.error,
      };
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
    if (payload.p !== 'tiktok_oauth')
      return { status: 'error', detail: 'state invalide' };

    try {
      const token = await this.exchangeCode(input.code);
      const handle = await this.fetchDisplayName(token.access_token).catch(
        () => undefined,
      );
      await this.upsertAccount(payload.t, payload.c, token, handle);
      return { status: 'connected', handle };
    } catch (err) {
      this.logger.error(`Callback TikTok en échec: ${(err as Error).message}`);
      return { status: 'error', detail: (err as Error).message };
    }
  }

  resultRedirectUrl(result: TikTokCallbackResult): string {
    const params = new URLSearchParams({
      social: 'tiktok',
      status: result.status,
    });
    if (result.handle) params.set('handle', result.handle);
    if (result.detail && result.status !== 'connected')
      params.set('detail', result.detail);
    return `${this.webAppUrl}/dashboard/social/accounts?${params.toString()}`;
  }

  // ---------- API ----------

  private async exchangeCode(code: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      client_key: this.clientKey!,
      client_secret: this.clientSecret!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri!,
    });
    const res = await fetch(`${API_BASE}/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const json = (await res.json().catch(() => ({}))) as TokenResponse;
    if (!res.ok || json.error || !json.access_token) {
      throw new Error(
        json.error_description ??
          json.error ??
          `oauth/token HTTP ${res.status}`,
      );
    }
    return json;
  }

  private async fetchDisplayName(
    accessToken: string,
  ): Promise<string | undefined> {
    const res = await fetch(
      `${API_BASE}/user/info/?fields=open_id,display_name`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const json = (await res.json().catch(() => ({}))) as {
      data?: { user?: { display_name?: string } };
    };
    return json.data?.user?.display_name;
  }

  private async upsertAccount(
    tenantId: string,
    companyId: string,
    token: TokenResponse,
    handle: string | undefined,
  ): Promise<void> {
    const accessTokenEnc = this.cipher.encrypt(token.access_token);
    const refreshTokenEnc = this.cipher.encrypt(token.refresh_token);
    const scopes = token.scope
      ? token.scope.split(/[ ,]+/).filter(Boolean)
      : TIKTOK_SCOPES;
    const tokenExpiresAt = new Date(Date.now() + token.expires_in * 1000);

    const account = await this.prisma.socialAccount.upsert({
      where: {
        companyId_network: { companyId, network: SocialNetwork.TIKTOK },
      },
      create: {
        tenantId,
        companyId,
        network: SocialNetwork.TIKTOK,
        externalId: token.open_id,
        handle: handle ?? null,
        accessTokenEnc,
        refreshTokenEnc,
        scopes,
        tokenExpiresAt,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
      },
      update: {
        externalId: token.open_id,
        handle: handle ?? null,
        accessTokenEnc,
        refreshTokenEnc,
        scopes,
        tokenExpiresAt,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
      },
    });

    const reason =
      'App TikTok non auditée — publication en brouillon (boîte de réception). Audit requis pour la publication directe.';
    const existing = await this.prisma.socialAccountCapability.findUnique({
      where: { accountId: account.id },
    });
    if (!existing) {
      await this.prisma.socialAccountCapability.create({
        data: {
          tenantId,
          accountId: account.id,
          capability: 'DRAFT_ONLY',
          reason,
        },
      });
    } else if (existing.capability === 'EXPIRED') {
      await this.prisma.socialAccountCapability.update({
        where: { accountId: account.id },
        data: { capability: 'DRAFT_ONLY', reason, checkedAt: new Date() },
      });
    } else {
      await this.prisma.socialAccountCapability.update({
        where: { accountId: account.id },
        data: { checkedAt: new Date() },
      });
    }
  }
}
