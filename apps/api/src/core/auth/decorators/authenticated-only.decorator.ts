import { SetMetadata } from '@nestjs/common';

export const AUTHENTICATED_ONLY_KEY = 'authenticatedOnly';

/**
 * Marque explicitement une route comme n'exigeant qu'une authentification
 * valide, sans permission specifique — pour un endpoint "self-service" (voir
 * ou gerer ses propres notifications, son MFA, son mot de passe, son
 * profil...). PermissionsGuard laisse deja passer ces routes par defaut
 * (fail-open quand aucune permission n'est declaree, voir son commentaire) ;
 * ce decorateur documente que c'est voulu plutot que de laisser planer le
 * doute sur un oubli, et evite que
 * test/authorization-coverage.e2e-spec.ts ne le signale a tort.
 */
export const AuthenticatedOnly = () =>
  SetMetadata(AUTHENTICATED_ONLY_KEY, true);
