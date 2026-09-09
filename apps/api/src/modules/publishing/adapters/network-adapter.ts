import { SocialCapabilityKind, SocialNetwork } from '@prisma/client';

/**
 * Contrat d'un adaptateur réseau. Un adaptateur ne connaît que « publier ce
 * contenu sur ce compte » ; toute la logique de capacité / fallback / retry
 * vit dans le PublisherService. Les adaptateurs réels (Meta, TikTok) arrivent
 * aux increments suivants — voir docs/CAHIER-DES-CHARGES-RESEAUX.md §8.
 */
export type PublishOutcome = 'PUBLISHED' | 'DRAFT_CREATED' | 'MANUAL_REQUIRED';

export interface PublishInput {
  network: SocialNetwork;
  capability: SocialCapabilityKind;
  /** 1 pour la première tentative. */
  attemptNumber: number;
  caption: string | null;
  hashtags: string[];
  /**
   * Ids de MediaAsset. En attendant le pipeline d'hébergement média, une
   * valeur qui est déjà une URL http(s) publique est utilisée telle quelle
   * (permet les tests manuels).
   */
  mediaIds: string[];
  account: {
    id: string;
    handle: string | null;
    externalId: string | null;
    /** Jeton d'accès déchiffré, ou null si le compte n'est pas connecté. */
    accessToken: string | null;
  };
}

export interface PublishResult {
  outcome: PublishOutcome;
  externalPostId?: string;
  detail?: string;
}

/** Erreur « métier » d'un adaptateur : `retryable` pilote le backoff. */
export class PublishError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'PublishError';
  }
}

export interface NetworkAdapter {
  readonly network: SocialNetwork;
  publish(input: PublishInput): Promise<PublishResult>;
}
