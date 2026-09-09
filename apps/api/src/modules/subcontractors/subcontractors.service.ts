import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../core/tenancy/tenant-prisma.service';
import type { AuthenticatedUser } from '../../core/auth/types/jwt-payload.interface';
import { CreateSubcontractorDto } from './dto/create-subcontractor.dto';
import { UpdateSubcontractorDto } from './dto/update-subcontractor.dto';

@Injectable()
export class SubcontractorsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  findAll() {
    return this.tenantPrisma.client.subcontractor.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(id: string) {
    const subcontractor =
      await this.tenantPrisma.client.subcontractor.findUnique({
        where: { id },
      });
    if (!subcontractor) throw new NotFoundException('Subcontractor not found');
    return subcontractor;
  }

  create(dto: CreateSubcontractorDto, user: AuthenticatedUser) {
    return this.tenantPrisma.client.subcontractor.create({
      data: {
        tenantId: this.tenantPrisma.tenantId,
        createdById: user.id,
        ...dto,
      },
    });
  }

  async update(id: string, dto: UpdateSubcontractorDto) {
    await this.findOneOrThrow(id);
    return this.tenantPrisma.client.subcontractor.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.tenantPrisma.client.subcontractor.delete({ where: { id } });
  }
}
