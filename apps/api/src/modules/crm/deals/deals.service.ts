import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { AutomationService } from '../../automation/automation.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { ListDealsQuery } from './dto/list-deals.query';
import { MoveDealDto } from './dto/move-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

@Injectable()
export class DealsService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly automation: AutomationService,
  ) {}

  findAll(query: ListDealsQuery) {
    return this.tenantPrisma.client.deal.findMany({
      where: {
        ...(query.stageId ? { stageId: query.stageId } : {}),
        ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      },
      include: { stage: true, company: true, contact: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(id: string) {
    const deal = await this.tenantPrisma.client.deal.findUnique({
      where: { id },
      include: {
        stage: true,
        company: true,
        contact: true,
        stageHistory: { include: { stage: true }, orderBy: { enteredAt: 'asc' } },
      },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }

  async create(dto: CreateDealDto) {
    return this.tenantPrisma.transaction(async (tx) => {
      let stageId = dto.stageId;
      if (!stageId) {
        const firstStage = await tx.pipelineStage.findFirst({ orderBy: { order: 'asc' } });
        if (!firstStage) {
          throw new BadRequestException('No pipeline stage configured for this tenant yet');
        }
        stageId = firstStage.id;
      }

      const deal = await tx.deal.create({
        data: {
          tenantId: this.tenantPrisma.tenantId,
          title: dto.title,
          companyId: dto.companyId,
          contactId: dto.contactId,
          stageId,
          ownerId: dto.ownerId,
          estimatedValue: dto.estimatedValue,
          winProbability: dto.winProbability,
          source: dto.source,
          sourceSocialNetwork: dto.sourceSocialNetwork,
          nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : undefined,
        },
      });
      await tx.dealStageHistory.create({ data: { dealId: deal.id, stageId } });
      return deal;
    });
  }

  async update(id: string, dto: UpdateDealDto) {
    await this.findOneOrThrow(id);
    return this.tenantPrisma.client.deal.update({
      where: { id },
      data: {
        ...dto,
        nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.tenantPrisma.client.deal.delete({ where: { id } });
  }

  async move(id: string, dto: MoveDealDto) {
    const result = await this.tenantPrisma.transaction(async (tx) => {
      const deal = await tx.deal.findUnique({ where: { id } });
      if (!deal) throw new NotFoundException('Deal not found');

      const targetStage = await tx.pipelineStage.findUnique({ where: { id: dto.stageId } });
      if (!targetStage) throw new NotFoundException('Pipeline stage not found');

      const updated = await tx.deal.update({ where: { id }, data: { stageId: dto.stageId } });
      await tx.dealStageHistory.create({ data: { dealId: id, stageId: dto.stageId } });

      let companyName: string | null = null;
      if (targetStage.isWon && deal.companyId) {
        await tx.company.updateMany({
          where: { id: deal.companyId, isClient: false },
          data: { isClient: true, clientSince: new Date() },
        });
        const company = await tx.company.findUnique({ where: { id: deal.companyId } });
        companyName = company?.name ?? null;
      }

      return { updated, isWon: targetStage.isWon, companyName };
    });

    if (result.isWon) {
      await this.automation.fire('DEAL_WON', {
        companyId: result.updated.companyId,
        companyName: result.companyName,
        ownerId: result.updated.ownerId,
        dealTitle: result.updated.title,
      });
    }

    return result.updated;
  }
}
