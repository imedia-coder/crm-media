import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { ListCompaniesQuery } from './dto/list-companies.query';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  findAll(query: ListCompaniesQuery) {
    return this.tenantPrisma.client.company.findMany({
      where: query.isClient === undefined ? {} : { isClient: query.isClient },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(id: string) {
    const company = await this.tenantPrisma.client.company.findUnique({
      where: { id },
      include: { contacts: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  create(dto: CreateCompanyDto) {
    return this.tenantPrisma.client.company.create({
      data: {
        tenantId: this.tenantPrisma.tenantId,
        name: dto.name,
        sizeRange: dto.sizeRange,
        estimatedRevenue: dto.estimatedRevenue,
        isClient: dto.isClient ?? false,
        clientSince: dto.isClient ? new Date() : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOneOrThrow(id);
    return this.tenantPrisma.client.company.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.tenantPrisma.client.company.delete({ where: { id } });
  }
}
