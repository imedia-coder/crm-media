import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQuery } from './dto/list-projects.query';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  findAll(query: ListProjectsQuery) {
    return this.tenantPrisma.client.project.findMany({
      where: {
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.status ? { status: query.status as never } : {}),
      },
      include: { company: true, manager: true, _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(id: string) {
    const project = await this.tenantPrisma.client.project.findUnique({
      where: { id },
      include: {
        company: true,
        manager: true,
        tasks: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  create(dto: CreateProjectDto) {
    return this.tenantPrisma.client.project.create({
      data: {
        tenantId: this.tenantPrisma.tenantId,
        name: dto.name,
        companyId: dto.companyId,
        status: dto.status,
        budget: dto.budget,
        managerId: dto.managerId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOneOrThrow(id);
    return this.tenantPrisma.client.project.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.tenantPrisma.client.project.delete({ where: { id } });
  }
}
