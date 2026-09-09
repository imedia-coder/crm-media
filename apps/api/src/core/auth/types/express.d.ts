import { AuthenticatedUser } from './jwt-payload.interface';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- extension deliberee pour la fusion de declarations Express
    interface User extends AuthenticatedUser {}
  }
}
