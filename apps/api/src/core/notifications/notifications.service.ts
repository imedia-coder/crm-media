import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';

type NotificationType = 'TASK_ASSIGNED' | 'QUOTE_ACCEPTED' | 'INVOICE_PAID' | 'CONTENT_VALIDATION_NEEDED' | 'GENERIC';

@Injectable()
export class NotificationsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async notifyUser(
    userId: string,
    type: NotificationType,
    title: string,
    options?: { message?: string; link?: string },
  ) {
    await this.tenantPrisma.client.notification.create({
      data: {
        tenantId: this.tenantPrisma.tenantId,
        userId,
        type,
        title,
        message: options?.message,
        link: options?.link,
      },
    });
  }

  /**
   * Notifies every user whose role has the given permission (or the
   * wildcard "*"). Used for events that concern a role rather than one
   * specific person, e.g. "a piece of content needs validation".
   */
  async notifyUsersWithPermission(
    permission: string,
    type: NotificationType,
    title: string,
    options?: { message?: string; link?: string },
  ) {
    const users = await this.tenantPrisma.client.user.findMany({
      where: {
        role: { permissions: { some: { action: { in: [permission, '*'] } } } },
      },
      select: { id: true },
    });
    const tenantId = this.tenantPrisma.tenantId;
    if (users.length === 0) return;
    await this.tenantPrisma.client.notification.createMany({
      data: users.map((u) => ({
        tenantId,
        userId: u.id,
        type,
        title,
        message: options?.message,
        link: options?.link,
      })),
    });
  }

  findMine(userId: string) {
    return this.tenantPrisma.client.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async unreadCount(userId: string) {
    return this.tenantPrisma.client.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(id: string, userId: string) {
    await this.tenantPrisma.client.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.tenantPrisma.client.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
