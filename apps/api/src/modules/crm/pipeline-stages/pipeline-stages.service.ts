import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { CreatePipelineStageDto } from './dto/create-pipeline-stage.dto';
import { ReorderPipelineStagesDto } from './dto/reorder-pipeline-stages.dto';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto';

@Injectable()
export class PipelineStagesService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  findAll() {
    return this.tenantPrisma.client.pipelineStage.findMany({ orderBy: { order: 'asc' } });
  }

  async findOneOrThrow(id: string) {
    const stage = await this.tenantPrisma.client.pipelineStage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException('Pipeline stage not found');
    return stage;
  }

  create(dto: CreatePipelineStageDto) {
    return this.tenantPrisma.client.pipelineStage.create({
      data: {
        tenantId: this.tenantPrisma.tenantId,
        name: dto.name,
        order: dto.order,
        isWon: dto.isWon ?? false,
        isLost: dto.isLost ?? false,
      },
    });
  }

  async update(id: string, dto: UpdatePipelineStageDto) {
    await this.findOneOrThrow(id);
    return this.tenantPrisma.client.pipelineStage.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    const dealsUsingStage = await this.tenantPrisma.client.deal.count({ where: { stageId: id } });
    if (dealsUsingStage > 0) {
      throw new ConflictException('Cannot delete a pipeline stage that still has deals in it');
    }
    await this.tenantPrisma.client.pipelineStage.delete({ where: { id } });
  }

  async reorder(dto: ReorderPipelineStagesDto) {
    await this.tenantPrisma.transaction(async (tx) => {
      for (const s of dto.stages) {
        await tx.pipelineStage.update({ where: { id: s.id }, data: { order: s.order } });
      }
    });
    return this.findAll();
  }
}
