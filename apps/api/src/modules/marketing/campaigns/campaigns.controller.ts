import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { MARKETING_PERMISSIONS } from '../../../core/auth/permissions.constants';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { ListCampaignsQuery } from './dto/list-campaigns.query';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Controller('marketing/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @RequirePermissions(MARKETING_PERMISSIONS.CAMPAIGNS_READ)
  @Get()
  findAll(@Query() query: ListCampaignsQuery) {
    return this.campaignsService.findAll(query);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.CAMPAIGNS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOneOrThrow(id);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.CAMPAIGNS_WRITE)
  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(dto);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.CAMPAIGNS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.update(id, dto);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.CAMPAIGNS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }
}
