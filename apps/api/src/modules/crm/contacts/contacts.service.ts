import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ListContactsQuery } from './dto/list-contacts.query';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  findAll(query: ListContactsQuery) {
    return this.tenantPrisma.client.contact.findMany({
      where: query.companyId ? { companyId: query.companyId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(id: string) {
    const contact = await this.tenantPrisma.client.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  create(dto: CreateContactDto) {
    return this.tenantPrisma.client.contact.create({
      data: {
        ...dto,
        tenantId: this.tenantPrisma.tenantId,
        consentGivenAt: dto.marketingConsent ? new Date() : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateContactDto) {
    const existing = await this.findOneOrThrow(id);
    if (existing.anonymizedAt) {
      throw new ConflictException('This contact has been anonymized (RGPD) and can no longer be edited');
    }
    return this.tenantPrisma.client.contact.update({
      where: { id },
      data: {
        ...dto,
        // Withdrawing consent (false) clears the proof-of-consent timestamp;
        // giving it (true) stamps the moment it was recorded, rather than
        // trusting a client-supplied date.
        ...(dto.marketingConsent !== undefined
          ? { consentGivenAt: dto.marketingConsent ? new Date() : null }
          : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.tenantPrisma.client.contact.delete({ where: { id } });
  }

  /**
   * RGPD right of access: every piece of personal data this tenant holds
   * about this person, in one place, for a data-subject-access request.
   */
  async exportPersonalData(id: string) {
    const contact = await this.tenantPrisma.client.contact.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        deals: { select: { id: true, title: true, createdAt: true, stage: { select: { name: true } } } },
      },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    return {
      exportedAt: new Date().toISOString(),
      identity: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
      },
      company: contact.company,
      consent: {
        marketingConsent: contact.marketingConsent,
        consentGivenAt: contact.consentGivenAt,
        consentSource: contact.consentSource,
      },
      associatedDeals: contact.deals.map((d) => ({
        title: d.title,
        stage: d.stage.name,
        createdAt: d.createdAt,
      })),
      recordCreatedAt: contact.createdAt,
      recordLastUpdatedAt: contact.updatedAt,
    };
  }

  /**
   * RGPD right to erasure. Deals/history referencing this contact are kept
   * (an agency's own business records — proposals sent, deal outcomes —
   * aren't solely "this person's data" to erase on their request), but every
   * directly identifying field is scrubbed and the row is locked from
   * further edits via update()'s anonymizedAt check above.
   */
  async anonymize(id: string) {
    await this.findOneOrThrow(id);
    return this.tenantPrisma.client.contact.update({
      where: { id },
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
  }
}
