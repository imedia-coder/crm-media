import { AuthenticatedUser } from './jwt-payload.interface';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-pattern
    interface User extends AuthenticatedUser {}
  }
}
