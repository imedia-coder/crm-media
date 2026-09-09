import { SocialNetwork } from '@prisma/client';
import {
  NetworkAdapter,
  PublishError,
  PublishInput,
  PublishResult,
} from './network-adapter';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = () => Math.random().toString(36).slice(2, 10);

/**
 * Adaptateur de simulation — rend toute la chaîne testable de bout en bout
 * avant d'avoir les vraies API. Le comportement se pilote par des jetons dans
 * la légende :
 *   [[fail]]   → échec définitif (non ré-essayable)
 *   [[flaky]]  → échec ré-essayable, puis succès à la 3e tentative
 *   [[draft]]  → dépôt d'un brouillon (→ ACTION_REQUISE)
 *   [[manual]] → publication manuelle requise (→ ACTION_REQUISE)
 * Sans jeton : succès. Une capacité DRAFT_ONLY force le comportement [[draft]].
 */
export class FakeNetworkAdapter implements NetworkAdapter {
  constructor(readonly network: SocialNetwork) {}

  async publish(input: PublishInput): Promise<PublishResult> {
    const caption = (input.caption ?? '').toLowerCase();
    await wait(150);

    if (caption.includes('[[fail]]')) {
      throw new PublishError(
        'Échec forcé (jeton [[fail]])',
        'FORCED_FAILURE',
        false,
      );
    }
    if (caption.includes('[[flaky]]') && input.attemptNumber < 3) {
      throw new PublishError(
        'Erreur transitoire simulée (jeton [[flaky]])',
        'TRANSIENT',
        true,
      );
    }
    if (caption.includes('[[manual]]')) {
      return { outcome: 'MANUAL_REQUIRED', detail: 'Jeton [[manual]]' };
    }
    if (caption.includes('[[draft]]') || input.capability === 'DRAFT_ONLY') {
      return {
        outcome: 'DRAFT_CREATED',
        externalPostId: `fakedraft_${input.network}_${rand()}`,
        detail: 'Brouillon simulé',
      };
    }
    return {
      outcome: 'PUBLISHED',
      externalPostId: `fakepost_${input.network}_${rand()}`,
    };
  }
}
