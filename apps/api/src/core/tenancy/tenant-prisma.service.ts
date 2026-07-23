import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Request-scoped Prisma client bound to the tenant of the current request.
 *
 * Every operation runs inside a transaction that first sets
 * `app.tenant_id` for that transaction only (`set_config(..., true)`),
 * which is what the Row-Level Security policies check. This is the only
 * client feature modules (CRM, Projects, Billing, ...) should use — never
 * inject the base PrismaService directly for tenant-scoped data.
 *
 * The tenant id is read lazily (via the `client` getter, not the
 * constructor): Nest instantiates request-scoped providers while building
 * the per-request DI subtree, which happens before guards run and
 * populate `request.user`. Reading it eagerly here would throw for every
 * request, including public routes that never touch `client` at all.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  get client() {
    const tenantId = this.request.user?.tenantId;
    if (!tenantId) {
      throw new Error('TenantPrismaService used outside of an authenticated, tenant-scoped request');
    }
    return TenantPrismaService.extend(this.prisma, tenantId);
  }

  private static extend(prisma: PrismaService, tenantId: string) {
    return prisma.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            const [, result] = await prisma.$transaction([
              prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
              query(args),
            ]);
            return result;
          },
        },
      },
    });
  }
}
