import { SocialNetwork } from '@prisma/client';
import {
  NetworkAdapter,
  PublishError,
  PublishInput,
  PublishResult,
} from './network-adapter';

const API_BASE = 'https://open.tiktokapis.com/v2';
const VIDEO_RE = /\.(mp4|mov|m4v|webm)(\?|$)/i;

type TikTokError = { code?: string; message?: string; log_id?: string };
type TikTokEnvelope<T> = { data?: T; error?: TikTokError };

/**
 * Adaptateur TikTok (Content Posting API).
 *
 * V1 : l'app n'est pas auditée → on utilise le dépôt en **boîte de réception**
 * (`/post/publish/inbox/video/init/`), qui ne demande pas d'audit ; l'opérateur
 * du compte finalise dans l'app TikTok. Résultat = DRAFT_CREATED.
 * Quand la capacité passe AUTO_PUBLISH (app auditée), on bascule sur la
 * publication directe.
 *
 * Limite : TikTok tire le média depuis une URL publique (PULL_FROM_URL). Tant
 * que le pipeline d'hébergement média n'existe pas, seuls les `mediaIds` déjà
 * en http(s) sont exploitables (et le domaine doit être vérifié pour la
 * publication directe).
 */
export class TikTokAdapter implements NetworkAdapter {
  readonly network = SocialNetwork.TIKTOK;

  async publish(input: PublishInput): Promise<PublishResult> {
    if (!input.account.accessToken) {
      throw new PublishError(
        'Compte TikTok non connecté (jeton absent).',
        'NO_TOKEN',
        false,
      );
    }
    const token = input.account.accessToken;
    const mediaUrls = input.mediaIds.filter((m) => /^https?:\/\//i.test(m));
    if (mediaUrls.length === 0) {
      throw new PublishError(
        'TikTok exige un média : fournissez une URL publique dans mediaIds (hébergement média à venir).',
        'MEDIA_URL_REQUIRED',
        false,
      );
    }
    const url = mediaUrls[0];
    const caption = this.composeCaption(input.caption, input.hashtags);
    const isVideo =
      VIDEO_RE.test(url) || !/\.(jpe?g|png|webp)(\?|$)/i.test(url);

    if (input.capability === 'AUTO_PUBLISH') {
      return this.directPost(token, caption, url, isVideo);
    }
    return this.inboxDeposit(token, url, isVideo);
  }

  // ---------- Boîte de réception (sans audit) ----------

  private async inboxDeposit(
    token: string,
    url: string,
    isVideo: boolean,
  ): Promise<PublishResult> {
    if (!isVideo) {
      // Le dépôt boîte de réception ne concerne que la vidéo côté TikTok.
      throw new PublishError(
        'Dépôt TikTok en brouillon : vidéo uniquement pour le moment.',
        'TIKTOK_PHOTO_UNSUPPORTED',
        false,
      );
    }
    const res = await this.post<{ publish_id: string }>(
      '/post/publish/inbox/video/init/',
      token,
      {
        source_info: { source: 'PULL_FROM_URL', video_url: url },
      },
    );
    return {
      outcome: 'DRAFT_CREATED',
      externalPostId: res.publish_id,
      detail:
        'Vidéo déposée dans la boîte de réception TikTok — à finaliser dans l’app.',
    };
  }

  // ---------- Publication directe (app auditée) ----------

  private async directPost(
    token: string,
    caption: string,
    url: string,
    isVideo: boolean,
  ): Promise<PublishResult> {
    if (isVideo) {
      const res = await this.post<{ publish_id: string }>(
        '/post/publish/video/init/',
        token,
        {
          post_info: { title: caption, privacy_level: 'PUBLIC_TO_EVERYONE' },
          source_info: { source: 'PULL_FROM_URL', video_url: url },
        },
      );
      return { outcome: 'PUBLISHED', externalPostId: res.publish_id };
    }
    const res = await this.post<{ publish_id: string }>(
      '/post/publish/content/init/',
      token,
      {
        post_info: { title: caption, privacy_level: 'PUBLIC_TO_EVERYONE' },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_images: [url],
          photo_cover_index: 0,
        },
        post_mode: 'DIRECT_POST',
        media_type: 'PHOTO',
      },
    );
    return { outcome: 'PUBLISHED', externalPostId: res.publish_id };
  }

  // ---------- HTTP ----------

  private composeCaption(caption: string | null, hashtags: string[]): string {
    const tags = hashtags
      .map((h) => (h.startsWith('#') ? h : `#${h}`))
      .join(' ')
      .trim();
    return [caption?.trim(), tags].filter(Boolean).join(' ').trim();
  }

  private async post<T>(
    path: string,
    token: string,
    payload: Record<string, unknown>,
  ): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as TikTokEnvelope<T>;
    const error = json.error;
    if (!res.ok || (error && error.code && error.code !== 'ok')) {
      this.throwTikTok(error ?? { message: `HTTP ${res.status}` });
    }
    return json.data ?? ({} as T);
  }

  private throwTikTok(err: TikTokError): never {
    const code = err.code ?? 'UNKNOWN';
    const message = err.message ?? 'Erreur Content Posting API.';
    if (code === 'access_token_invalid' || code === 'scope_not_authorized') {
      throw new PublishError(message, 'TOKEN_INVALID', false);
    }
    const retryable =
      code === 'rate_limit_exceeded' || code === 'internal_error';
    throw new PublishError(message, `TIKTOK_${code}`, retryable);
  }
}
