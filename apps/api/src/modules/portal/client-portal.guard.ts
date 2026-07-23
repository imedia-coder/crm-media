import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Gates the /portal/* namespace to client users only. Internal staff
 * (isClient: false) never have a companyId and must use the regular
 * /crm, /projects, /billing, /documents routes instead — this guard
 * keeps the two audiences from ever sharing an endpoint, since portal
 * routes intentionally skip the permission system (client users have no
 * role/permissions) and instead scope every query by the caller's own
 * companyId.
 */
@Injectable()
export class ClientPortalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.user?.isClient || !request.user.companyId) {
      throw new ForbiddenException('Client portal access only');
    }
    return true;
  }
}
