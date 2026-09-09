import { SocialNetwork } from '@prisma/client';
import {
  NetworkAdapter,
  PublishError,
  PublishInput,
  PublishResult,
} from './network-adapter';

const VIDEO_RE = /\.(mp4|mov|m4v)(\?|$)/i;
// Codes Graph API considérés comme transitoires (rate limit / indispo).
const RETRYABLE_CODES = new Set([1, 2, 4, 17, 32, 341, 613]);

type GraphError = {
  message?: string;
  code?: number;
  error_subcode?: number;
  type?: string;
};

/**
 * Adaptateur Meta (Instagram Graph API + Facebook Pages).
 * Utilisé pour INSTAGRAM et FACEBOOK dès que `META_APP_ID` / `META_APP_SECRET`
 * sont configurés (sinon `FakeNetworkAdapter`). Une instance par réseau.
 *
 * Limite connue V1 : Instagram exige une URL média publique. Tant que le
 * pipeline d'hébergement média n'existe pas, seules les entrées `mediaIds`
 * qui sont déjà des URLs http(s) sont exploitables.
 */
export class MetaAdapter implements NetworkAdapter {
  constructor(
    readonly network: SocialNetwork,
    private readonly graphVersion: string,
  ) {}

  async publish(input: PublishInput): Promise<PublishResult> {
    if (!input.account.accessToken) {
      throw new PublishError(
        'Compte non connecté (jeton absent).',
        'NO_TOKEN',
        false,
      );
    }
    if (!input.account.externalId) {
      throw new PublishError(
        'Identifiant du compte réseau manquant.',
        'NO_EXTERNAL_ID',
        false,
      );
    }
    const token = input.account.accessToken;
    const caption = this.composeCaption(input.caption, input.hashtags);
    const mediaUrls = input.mediaIds.filter((m) => /^https?:\/\//i.test(m));

    if (this.network === SocialNetwork.INSTAGRAM) {
      return this.publishInstagram(
        input.account.externalId,
        token,
        caption,
        mediaUrls,
      );
    }
    return this.publishFacebook(
      input.account.externalId,
      token,
      caption,
      mediaUrls,
    );
  }

  // ---------- Instagram ----------

  private async publishInstagram(
    igUserId: string,
    token: string,
    caption: string,
    mediaUrls: string[],
  ): Promise<PublishResult> {
    if (mediaUrls.length === 0) {
      throw new PublishError(
        'Instagram exige un média : fournissez une URL publique dans mediaIds (hébergement média à venir).',
        'MEDIA_URL_REQUIRED',
        false,
      );
    }
    const url = mediaUrls[0];
    const isVideo = VIDEO_RE.test(url);

    const container = await this.graphPost<{ id: string }>(
      `${igUserId}/media`,
      {
        [isVideo ? 'video_url' : 'image_url']: url,
        ...(isVideo ? { media_type: 'REELS' } : {}),
        caption,
        access_token: token,
      },
    );

    if (isVideo) {
      await this.waitForContainer(container.id, token);
    }

    const published = await this.graphPost<{ id: string }>(
      `${igUserId}/media_publish`,
      {
        creation_id: container.id,
        access_token: token,
      },
    );
    return { outcome: 'PUBLISHED', externalPostId: published.id };
  }

  private async waitForContainer(
    containerId: string,
    token: string,
  ): Promise<void> {
    for (let i = 0; i < 12; i++) {
      const status = await this.graphGet<{
        status_code?: string;
        status?: string;
      }>(containerId, {
        fields: 'status_code',
        access_token: token,
      });
      if (status.status_code === 'FINISHED') return;
      if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
        throw new PublishError(
          `Traitement du média Instagram en échec (${status.status_code}).`,
          'IG_CONTAINER_ERROR',
          false,
        );
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
    throw new PublishError(
      "Le média Instagram n'est pas prêt après 60 s.",
      'IG_CONTAINER_TIMEOUT',
      true,
    );
  }

  // ---------- Facebook Page ----------

  private async publishFacebook(
    pageId: string,
    token: string,
    caption: string,
    mediaUrls: string[],
  ): Promise<PublishResult> {
    if (mediaUrls.length === 0) {
      const res = await this.graphPost<{ id: string }>(`${pageId}/feed`, {
        message: caption,
        access_token: token,
      });
      return { outcome: 'PUBLISHED', externalPostId: res.id };
    }
    const url = mediaUrls[0];
    if (VIDEO_RE.test(url)) {
      const res = await this.graphPost<{ id: string }>(`${pageId}/videos`, {
        file_url: url,
        description: caption,
        access_token: token,
      });
      return { outcome: 'PUBLISHED', externalPostId: res.id };
    }
    const res = await this.graphPost<{ id: string; post_id?: string }>(
      `${pageId}/photos`,
      {
        url,
        caption,
        access_token: token,
      },
    );
    return { outcome: 'PUBLISHED', externalPostId: res.post_id ?? res.id };
  }

  // ---------- Graph helpers ----------

  private composeCaption(caption: string | null, hashtags: string[]): string {
    const tags = hashtags
      .map((h) => (h.startsWith('#') ? h : `#${h}`))
      .join(' ')
      .trim();
    return [caption?.trim(), tags].filter(Boolean).join('\n\n');
  }

  private async graphGet<T>(
    path: string,
    params: Record<string, string>,
  ): Promise<T> {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(
      `https://graph.facebook.com/${this.graphVersion}/${path}?${qs}`,
    );
    return this.parse<T>(res);
  }

  private async graphPost<T>(
    path: string,
    params: Record<string, string | undefined>,
  ): Promise<T> {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) body.set(k, v);
    }
    const res = await fetch(
      `https://graph.facebook.com/${this.graphVersion}/${path}`,
      {
        method: 'POST',
        body,
      },
    );
    return this.parse<T>(res);
  }

  private async parse<T>(res: Awaited<ReturnType<typeof fetch>>): Promise<T> {
    const json = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok || json.error) {
      this.throwGraph(
        (json.error as GraphError) ?? { message: `HTTP ${res.status}` },
      );
    }
    return json as T;
  }

  private throwGraph(err: GraphError): never {
    const code = err.code;
    if (code === 190) {
      // Jeton invalide / révoqué → le PublisherService bascule la capacité en EXPIRED.
      throw new PublishError(
        err.message ?? 'Jeton Meta invalide.',
        'TOKEN_INVALID',
        false,
      );
    }
    const retryable = code !== undefined && RETRYABLE_CODES.has(code);
    throw new PublishError(
      err.message ?? 'Erreur Graph API.',
      `META_${code ?? 'ERR'}`,
      retryable,
    );
  }
}
