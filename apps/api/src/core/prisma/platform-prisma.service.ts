import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Connects with the DB owner role (bypasses Row-Level Security).
 *
 * Postgres RLS policies are checked against a row's own columns, including
 * for the RETURNING clause of INSERT/UPDATE — so creating the very first
 * row of a tenant-scoped table (tenant signup) can never satisfy a policy
 * that requires `tenantId = current tenant`, because no tenant context
 * exists yet. Tenant creation, cross-tenant admin/support tooling, and
 * anything else that must run before or outside of a tenant context use
 * this service instead of the tenant-scoped PrismaService.
 */
@Injectable()
export class PlatformPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
