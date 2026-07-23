import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { CRM_PERMISSIONS } from '../../../core/auth/permissions.constants';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { ListDealsQuery } from './dto/list-deals.query';
import { MoveDealDto } from './dto/move-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

@Controller('crm/deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @RequirePermissions(CRM_PERMISSIONS.DEALS_READ)
  @Get()
  findAll(@Query() query: ListDealsQuery) {
    return this.dealsService.findAll(query);
  }

  @RequirePermissions(CRM_PERMISSIONS.DEALS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dealsService.findOneOrThrow(id);
  }

  @RequirePermissions(CRM_PERMISSIONS.DEALS_WRITE)
  @Post()
  create(@Body() dto: CreateDealDto) {
    return this.dealsService.create(dto);
  }

  @RequirePermissions(CRM_PERMISSIONS.DEALS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDealDto) {
    return this.dealsService.update(id, dto);
  }

  @RequirePermissions(CRM_PERMISSIONS.DEALS_WRITE)
  @Post(':id/move')
  move(@Param('id') id: string, @Body() dto: MoveDealDto) {
    return this.dealsService.move(id, dto);
  }

  @RequirePermissions(CRM_PERMISSIONS.DEALS_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dealsService.remove(id);
  }
}
