import { Injectable, NotFoundException } from '@nestjs/common';
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
      data: { ...dto, tenantId: this.tenantPrisma.tenantId },
    });
  }

  async update(id: string, dto: UpdateContactDto) {
    await this.findOneOrThrow(id);
    return this.tenantPrisma.client.contact.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.tenantPrisma.client.contact.delete({ where: { id } });
  }
}
