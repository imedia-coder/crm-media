import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Request-scoped Prisma client bound to the tenant of the current request.
 *
 * This is the only client feature modules (CRM, Projects, Billing, ...)
 * should use — never inject the base PrismaService directly for
 * tenant-scoped data.
 *
 * The tenant id is read lazily (via the `client` getter and `transaction`
 * method, not the constructor): Nest instantiates request-scoped providers
 * while building the per-request DI subtree, which happens before guards
 * run and populate `request.user`. Reading it eagerly here would throw for
 * every request, including public routes that never touch this service.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  private requireTenantId(): string {
    const tenantId = this.request.user?.tenantId;
    if (!tenantId) {
      throw new Error('TenantPrismaService used outside of an authenticated, tenant-scoped request');
    }
    return tenantId;
  }

  /**
   * The current request's tenant id. Row-Level Security is what actually
   * keeps data isolated, but Prisma's generated types still require
   * `tenantId` on every create() call (it's a required scalar column) —
   * use this to fill it in rather than trusting client input.
   */
  get tenantId(): string {
    return this.requireTenantId();
  }

  /**
   * For single operations: each call is wrapped in its own transaction that
   * sets `app.tenant_id` first, satisfying the Row-Level Security policies.
   * Do NOT pass promises built from this client into `$transaction([...])`
   * — each one is already its own transaction underneath, so nesting them
   * that way does not compose. Use `transaction()` below for multi-step
   * atomic writes instead.
   */
  get client() {
    const tenantId = this.requireTenantId();
    return TenantPrismaService.extend(this.prisma, tenantId);
  }

  /**
   * For multi-step atomic writes (e.g. "deal marked won -> flag its company
   * as a client"). Sets `app.tenant_id` once for the whole transaction, then
   * runs `fn` with a plain (unextended) transactional client — every query
   * made through `tx` inherits that same tenant context automatically.
   */
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    const tenantId = this.requireTenantId();
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      return fn(tx);
    });
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
