import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PasswordService } from '../../../core/auth/password.service';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { InviteClientDto } from './dto/invite-client.dto';
import { ListCompaniesQuery } from './dto/list-companies.query';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly passwordService: PasswordService,
  ) {}

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
        notes: dto.notes,
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

  async inviteClient(companyId: string, dto: InviteClientDto) {
    await this.findOneOrThrow(companyId);

    const temporaryPassword = this.passwordService.generateTemporaryPassword();
    const passwordHash = await this.passwordService.hash(temporaryPassword);

    const user = await this.tenantPrisma.client.user
      .create({
        data: {
          tenantId: this.tenantPrisma.tenantId,
          companyId,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: 'ACTIVE',
          isClient: true,
        },
      })
      .catch((error) => {
        if (error?.code === 'P2002') {
          throw new ConflictException('A user with this email already exists for this tenant');
        }
        throw error;
      });

    return {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      temporaryPassword,
    };
  }
}
