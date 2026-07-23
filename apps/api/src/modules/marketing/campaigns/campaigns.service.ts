import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { ListCampaignsQuery } from './dto/list-campaigns.query';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  findAll(query: ListCampaignsQuery) {
    return this.tenantPrisma.client.campaign.findMany({
      where: {
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.status ? { status: query.status as never } : {}),
      },
      include: { company: true, _count: { select: { contentItems: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(id: string) {
    const campaign = await this.tenantPrisma.client.campaign.findUnique({
      where: { id },
      include: { company: true, contentItems: true, mediaAssets: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  create(dto: CreateCampaignDto) {
    return this.tenantPrisma.client.campaign.create({
      data: {
        tenantId: this.tenantPrisma.tenantId,
        name: dto.name,
        companyId: dto.companyId,
        objective: dto.objective,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        budget: dto.budget,
      },
    });
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findOneOrThrow(id);
    return this.tenantPrisma.client.campaign.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.tenantPrisma.client.campaign.delete({ where: { id } });
  }
}
