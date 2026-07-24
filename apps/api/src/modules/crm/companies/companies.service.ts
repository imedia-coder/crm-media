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
    const existing = await this.findOneOrThrow(id);
    if (existing.anonymizedAt) {
      throw new ConflictException('This company has been anonymized (RGPD) and can no longer be edited');
    }
    return this.tenantPrisma.client.company.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.tenantPrisma.client.company.delete({ where: { id } });
  }

  /**
   * RGPD right of access: everything held about this company and the
   * people tied to it, for a data-subject-access request.
   */
  async exportPersonalData(id: string) {
    const company = await this.tenantPrisma.client.company.findUnique({
      where: { id },
      include: {
        contacts: true,
        deals: { select: { id: true, title: true, createdAt: true, stage: { select: { name: true } } } },
        quotes: { select: { id: true, number: true, status: true, createdAt: true } },
        invoices: { select: { id: true, number: true, status: true, createdAt: true } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');

    return {
      exportedAt: new Date().toISOString(),
      identity: {
        name: company.name,
        sizeRange: company.sizeRange,
        estimatedRevenue: company.estimatedRevenue,
        isClient: company.isClient,
        clientSince: company.clientSince,
        notes: company.notes,
      },
      contacts: company.contacts.map((c) => ({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        marketingConsent: c.marketingConsent,
        consentGivenAt: c.consentGivenAt,
        consentSource: c.consentSource,
      })),
      associatedDeals: company.deals.map((d) => ({ title: d.title, stage: d.stage.name, createdAt: d.createdAt })),
      quotes: company.quotes,
      invoices: company.invoices,
      recordCreatedAt: company.createdAt,
      recordLastUpdatedAt: company.updatedAt,
    };
  }

  /**
   * RGPD right to erasure. Blocked while any quote/invoice references this
   * company: French accounting law requires keeping billing documents
   * (with the client's identity) for 10 years, which overrides erasure
   * (RGPD art. 17§3-b, legal-obligation exception). Prospects that never
   * reached billing can be anonymized freely; their contacts are scrubbed
   * along with the company since they only existed for this relationship.
   */
  async anonymize(id: string) {
    const company = await this.tenantPrisma.client.company.findUnique({
      where: { id },
      include: { _count: { select: { quotes: true, invoices: true } } },
    });
    if (!company) throw new NotFoundException('Company not found');
    if (company.anonymizedAt) return company;
    if (company._count.quotes > 0 || company._count.invoices > 0) {
      throw new ConflictException(
        'This company has quotes or invoices and cannot be erased: accounting records must legally be retained',
      );
    }

    return this.tenantPrisma.transaction(async (tx) => {
      await tx.contact.updateMany({
        where: { companyId: id, anonymizedAt: null },
        data: {
          firstName: 'Anonymisé',
          lastName: '',
          email: null,
          phone: null,
          marketingConsent: false,
          consentGivenAt: null,
          consentSource: null,
          anonymizedAt: new Date(),
        },
      });
      return tx.company.update({
        where: { id },
        data: {
          name: 'Entreprise anonymisée',
          sizeRange: null,
          estimatedRevenue: null,
          notes: null,
          anonymizedAt: new Date(),
        },
      });
    });
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
