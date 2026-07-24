import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { CRM_PERMISSIONS } from '../../../core/auth/permissions.constants';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ListContactsQuery } from './dto/list-contacts.query';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('crm/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @RequirePermissions(CRM_PERMISSIONS.CONTACTS_READ)
  @Get()
  findAll(@Query() query: ListContactsQuery) {
    return this.contactsService.findAll(query);
  }

  @RequirePermissions(CRM_PERMISSIONS.CONTACTS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactsService.findOneOrThrow(id);
  }

  @RequirePermissions(CRM_PERMISSIONS.CONTACTS_WRITE)
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactsService.create(dto);
  }

  @RequirePermissions(CRM_PERMISSIONS.CONTACTS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.contactsService.update(id, dto);
  }

  @RequirePermissions(CRM_PERMISSIONS.CONTACTS_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }

  @RequirePermissions(CRM_PERMISSIONS.CONTACTS_READ)
  @Get(':id/export')
  exportPersonalData(@Param('id') id: string) {
    return this.contactsService.exportPersonalData(id);
  }

  @RequirePermissions(CRM_PERMISSIONS.CONTACTS_WRITE)
  @Post(':id/anonymize')
  anonymize(@Param('id') id: string) {
    return this.contactsService.anonymize(id);
  }
}
