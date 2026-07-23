import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { CRM_PERMISSIONS } from '../../../core/auth/permissions.constants';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { ListCompaniesQuery } from './dto/list-companies.query';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('crm/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @RequirePermissions(CRM_PERMISSIONS.COMPANIES_READ)
  @Get()
  findAll(@Query() query: ListCompaniesQuery) {
    return this.companiesService.findAll(query);
  }

  @RequirePermissions(CRM_PERMISSIONS.COMPANIES_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOneOrThrow(id);
  }

  @RequirePermissions(CRM_PERMISSIONS.COMPANIES_WRITE)
  @Post()
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @RequirePermissions(CRM_PERMISSIONS.COMPANIES_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(id, dto);
  }

  @RequirePermissions(CRM_PERMISSIONS.COMPANIES_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
