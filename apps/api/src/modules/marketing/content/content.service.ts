import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../../../core/notifications/notifications.service';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { MARKETING_PERMISSIONS } from '../../../core/auth/permissions.constants';
import { CreateContentDto } from './dto/create-content.dto';
import { ListContentQuery } from './dto/list-content.query';
import { ScheduleContentDto } from './dto/schedule-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class ContentService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(query: ListContentQuery) {
    return this.tenantPrisma.client.contentItem.findMany({
      where: {
        ...(query.status ? { status: query.status as never } : {}),
        ...(query.campaignId ? { campaignId: query.campaignId } : {}),
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.from || query.to
          ? {
              scheduledAt: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
      },
      include: {
        company: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
        author: { select: { id: true, firstName: true, lastName: true } },
        mediaAssets: true,
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOneOrThrow(id: string) {
    const content = await this.tenantPrisma.client.contentItem.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        author: { select: { id: true, firstName: true, lastName: true } },
        validatedBy: { select: { id: true, firstName: true, lastName: true } },
        mediaAssets: true,
      },
    });
    if (!content) throw new NotFoundException('Content item not found');
    return content;
  }

  create(dto: CreateContentDto, authorId: string) {
    return this.tenantPrisma.client.contentItem.create({
      data: {
        tenantId: this.tenantPrisma.tenantId,
        title: dto.title,
        body: dto.body,
        type: dto.type,
        hashtags: dto.hashtags ?? [],
        companyId: dto.companyId,
        campaignId: dto.campaignId,
        projectId: dto.projectId,
        authorId,
      },
    });
  }

  async update(id: string, dto: UpdateContentDto) {
    const existing = await this.tenantPrisma.client.contentItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Content item not found');
    if (existing.status !== 'DRAFT') {
      throw new ConflictException('Only draft content can be edited');
    }
    return this.tenantPrisma.client.contentItem.update({ where: { id }, data: dto });
  }

  private async transition(id: string, expected: string | string[], data: Record<string, unknown>) {
    const content = await this.tenantPrisma.client.contentItem.findUnique({ where: { id } });
    if (!content) throw new NotFoundException('Content item not found');
    const expectedList = Array.isArray(expected) ? expected : [expected];
    if (!expectedList.includes(content.status)) {
      throw new ConflictException(`Content must be in status ${expectedList.join(' or ')} (currently ${content.status})`);
    }
    return this.tenantPrisma.client.contentItem.update({ where: { id }, data });
  }

  async submit(id: string) {
    const content = await this.transition(id, 'DRAFT', { status: 'PENDING_VALIDATION' });
    await this.notifications.notifyUsersWithPermission(
      MARKETING_PERMISSIONS.CONTENT_VALIDATE,
      'CONTENT_VALIDATION_NEEDED',
      `À valider : ${content.title}`,
      { link: '/dashboard/marketing/content' },
    );
    return content;
  }

  validate(id: string, validatedById: string) {
    return this.transition(id, 'PENDING_VALIDATION', { status: 'VALIDATED', validatedById });
  }

  reject(id: string, validatedById: string) {
    return this.transition(id, 'PENDING_VALIDATION', { status: 'REJECTED', validatedById });
  }

  schedule(id: string, dto: ScheduleContentDto) {
    return this.transition(id, 'VALIDATED', { status: 'SCHEDULED', scheduledAt: new Date(dto.scheduledAt) });
  }

  publish(id: string) {
    return this.transition(id, 'SCHEDULED', { status: 'PUBLISHED', publishedAt: new Date() });
  }

  async remove(id: string) {
    const content = await this.tenantPrisma.client.contentItem.findUnique({ where: { id } });
    if (!content) throw new NotFoundException('Content item not found');
    if (content.status !== 'DRAFT') {
      throw new ConflictException('Only draft content can be deleted');
    }
    await this.tenantPrisma.client.contentItem.delete({ where: { id } });
  }
}
