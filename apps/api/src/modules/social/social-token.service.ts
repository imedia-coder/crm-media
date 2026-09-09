import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialAccount, SocialNetwork } from '@prisma/client';
import { TokenCipherService } from '../../core/crypto/token-cipher.service';
import { PlatformPrismaService } from '../../core/prisma/platform-prisma.service';

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';
/** Rafraîchir un peu avant l'expiration réelle. */
const EXPIRY_SKEW_MS = 120_000;

type TikTokRefreshResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

/**
 * Fournit au moteur de publication un jeton d'accès valide pour un compte
 * social, en le rafraîchissant si nécessaire.
 *
 * - TikTok : jeton d'accès ~24 h → rafraîchissement via `refresh_token` avant
 *   chaque publication si expiré/proche de l'expiration ; le nouveau jeton est
 *   persisté (chiffré).
 * - Meta (Instagram/Facebook) : jetons de Page longue durée (~60 j) — pas de
 *   rafraîchissement proactif en V1, on renvoie le jeton stocké.
 *
 * En cas d'échec de rafraîchissement TikTok, la capacité du compte passe
 * EXPIRED et la méthode renvoie `null` (l'adaptateur lèvera alors une erreur
 * explicite « compte non connecté »).
 */
@Injectable()
export class SocialTokenService {
  private readonly logger = new Logger(SocialTokenService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PlatformPrismaService,
    private readonly cipher: TokenCipherService,
  ) {}

  async ensureFreshAccessToken(account: SocialAccount): Promise<string | null> {
    if (!account.accessTokenEnc) return null;

    if (account.network !== SocialNetwork.TIKTOK) {
      return this.cipher.decrypt(account.accessTokenEnc);
    }

    const stillValid =
      account.tokenExpiresAt &&
      account.tokenExpiresAt.getTime() - Date.now() > EXPIRY_SKEW_MS;
    if (stillValid) {
      return this.cipher.decrypt(account.accessTokenEnc);
    }

    if (!account.refreshTokenEnc) {
      await this.markExpired(
        account,
        'Aucun refresh token TikTok — reconnecter le compte.',
      );
      return null;
    }

    try {
      const refreshed = await this.refreshTikTok(
        this.cipher.decrypt(account.refreshTokenEnc),
      );
      await this.prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          accessTokenEnc: this.cipher.encrypt(refreshed.access_token),
          refreshTokenEnc: refreshed.refresh_token
            ? this.cipher.encrypt(refreshed.refresh_token)
            : account.refreshTokenEnc,
          tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
          lastSyncAt: new Date(),
        },
      });
      return refreshed.access_token;
    } catch (err) {
      this.logger.error(
        `Rafraîchissement TikTok échoué (compte ${account.id}): ${(err as Error).message}`,
      );
      await this.markExpired(
        account,
        `Rafraîchissement TikTok impossible : ${(err as Error).message}`,
      );
      return null;
    }
  }

  private async refreshTikTok(
    refreshToken: string,
  ): Promise<TikTokRefreshResponse> {
    const body = new URLSearchParams({
      client_key: this.config.get<string>('TIKTOK_CLIENT_KEY') ?? '',
      client_secret: this.config.get<string>('TIKTOK_CLIENT_SECRET') ?? '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    const res = await fetch(`${TIKTOK_API_BASE}/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const json = (await res.json().catch(() => ({}))) as TikTokRefreshResponse;
    if (!res.ok || json.error || !json.access_token) {
      throw new Error(
        json.error_description ?? json.error ?? `HTTP ${res.status}`,
      );
    }
    return json;
  }

  private async markExpired(
    account: SocialAccount,
    reason: string,
  ): Promise<void> {
    await this.prisma.socialAccountCapability
      .upsert({
        where: { accountId: account.id },
        create: {
          tenantId: account.tenantId,
          accountId: account.id,
          capability: 'EXPIRED',
          reason,
        },
        update: { capability: 'EXPIRED', reason, checkedAt: new Date() },
      })
      .catch(() => undefined);
  }
}
