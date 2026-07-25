import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { MARKETING_PERMISSIONS } from '../../../core/auth/permissions.constants';
import type { AuthenticatedUser } from '../../../core/auth/types/jwt-payload.interface';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { ListContentQuery } from './dto/list-content.query';
import { ScheduleContentDto } from './dto/schedule-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Controller('marketing/content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @RequirePermissions(MARKETING_PERMISSIONS.CONTENT_READ)
  @Get()
  findAll(@Query() query: ListContentQuery) {
    return this.contentService.findAll(query);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.CONTENT_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentService.findOneOrThrow(id);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.CONTENT_WRITE)
  @Post()
  create(@Body() dto: CreateContentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.contentService.create(dto, user.id);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.CONTENT_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.contentService.update(id, dto);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.CONTENT_WRITE)
  @Post(':id/submit')
  submit(@Param('id') id: string) {
    return this.contentService.submit(id);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.CONTENT_VALIDATE)
  @Post(':id/validate')
  validate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.contentService.validate(id, user.id);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.CONTENT_VALIDATE)
  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.contentService.reject(id, user.id);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.CONTENT_WRITE)
  @Post(':id/schedule')
  schedule(@Param('id') id: string, @Body() dto: ScheduleContentDto) {
    return this.contentService.schedule(id, dto);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.CONTENT_WRITE)
  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.contentService.publish(id);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.CONTENT_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }
}
