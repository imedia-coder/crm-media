import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PlatformPrismaService } from '../prisma/platform-prisma.service';

// RGPD "storage limitation" principle: data kept only as long as it serves a
// purpose. Neither of these categories has business value once stale — they
// are pure housekeeping, not records anyone would need to look back at.
const STALE_REFRESH_TOKEN_DAYS = 30;
const READ_NOTIFICATION_RETENTION_DAYS = 180;

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(private readonly platformPrisma: PlatformPrismaService) {}

  /**
   * Runs across every tenant. Only ever invoked by the nightly cron — the
   * HTTP-triggered path (`purgeForTenant`) scopes to the caller's own tenant
   * so one tenant's admin can never touch another tenant's rows, even rows
   * as low-stakes as expired tokens.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeAllTenants() {
    const result = await this.purge();
    this.logger.log(`Nightly retention purge: ${JSON.stringify(result)}`);
    return result;
  }

  purgeForTenant(tenantId: string) {
    return this.purge(tenantId);
  }

  private async purge(tenantId?: string) {
    const tokenCutoff = new Date(Date.now() - STALE_REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    const notificationCutoff = new Date(Date.now() - READ_NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // Sequential, not Promise.all: unrelated to the tenant-scoped RLS client,
    // but kept consistent with the rest of the codebase's discipline around
    // not firing concurrent queries on a shared client.
    const tokens = await this.platformPrisma.refreshToken.deleteMany({
      where: {
        OR: [{ revokedAt: { lt: tokenCutoff } }, { expiresAt: { lt: tokenCutoff } }],
        ...(tenantId ? { user: { tenantId } } : {}),
      },
    });

    const notifications = await this.platformPrisma.notification.deleteMany({
      where: {
        readAt: { lt: notificationCutoff },
        ...(tenantId ? { tenantId } : {}),
      },
    });

    return {
      purgedAt: new Date().toISOString(),
      staleRefreshTokensDeleted: tokens.count,
      readNotificationsDeleted: notifications.count,
    };
  }
}
