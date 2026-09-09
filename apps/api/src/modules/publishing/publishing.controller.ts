import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { PUBLISHING_PERMISSIONS } from '../../core/auth/permissions.constants';
import { CreatePostDto } from './dto/create-post.dto';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { CreateTargetDto } from './dto/create-target.dto';
import { ListPublicationsQuery } from './dto/list-publications.query';
import { SchedulePublicationDto } from './dto/schedule-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { UpdateTargetDto } from './dto/update-target.dto';
import { PublishingService } from './publishing.service';

@Controller('publishing')
export class PublishingController {
  constructor(private readonly publishingService: PublishingService) {}

  @RequirePermissions(PUBLISHING_PERMISSIONS.TARGETS_READ)
  @Get('publications')
  findAll(@Query() query: ListPublicationsQuery) {
    return this.publishingService.findAll(query);
  }

  @RequirePermissions(PUBLISHING_PERMISSIONS.TARGETS_READ)
  @Get('publications/:id')
  findOne(@Param('id') id: string) {
    return this.publishingService.findOneOrThrow(id);
  }

  @RequirePermissions(PUBLISHING_PERMISSIONS.TARGETS_WRITE)
  @Post('publications')
  create(@Body() dto: CreatePublicationDto) {
    return this.publishingService.create(dto);
  }

  /** Parcours "+ Créer un post" : tout en un appel. */
  @RequirePermissions(PUBLISHING_PERMISSIONS.PUBLISH_NOW)
  @Post('posts')
  createPost(@Body() dto: CreatePostDto) {
    return this.publishingService.createPost(dto);
  }

  @RequirePermissions(PUBLISHING_PERMISSIONS.TARGETS_WRITE)
  @Patch('publications/:id')
  update(@Param('id') id: string, @Body() dto: UpdatePublicationDto) {
    return this.publishingService.update(id, dto);
  }

  @RequirePermissions(PUBLISHING_PERMISSIONS.TARGETS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('publications/:id')
  remove(@Param('id') id: string) {
    return this.publishingService.remove(id);
  }

  @RequirePermissions(PUBLISHING_PERMISSIONS.SCHEDULE)
  @Post('publications/:id/schedule')
  schedule(@Param('id') id: string, @Body() dto: SchedulePublicationDto) {
    return this.publishingService.schedule(id, dto);
  }

  @RequirePermissions(PUBLISHING_PERMISSIONS.PUBLISH_NOW)
  @Post('publications/:id/publish-now')
  publishNow(@Param('id') id: string) {
    return this.publishingService.publishNow(id);
  }

  @RequirePermissions(PUBLISHING_PERMISSIONS.PUBLISH_NOW)
  @Post('targets/:targetId/run')
  runTarget(@Param('targetId') targetId: string) {
    return this.publishingService.runTarget(targetId);
  }

  @RequirePermissions(PUBLISHING_PERMISSIONS.TARGETS_WRITE)
  @Post('publications/:id/targets')
  addTarget(@Param('id') id: string, @Body() dto: CreateTargetDto) {
    return this.publishingService.addTarget(id, dto);
  }

  @RequirePermissions(PUBLISHING_PERMISSIONS.TARGETS_WRITE)
  @Patch('targets/:targetId')
  updateTarget(
    @Param('targetId') targetId: string,
    @Body() dto: UpdateTargetDto,
  ) {
    return this.publishingService.updateTarget(targetId, dto);
  }

  @RequirePermissions(PUBLISHING_PERMISSIONS.TARGETS_WRITE)
  @Delete('targets/:targetId')
  removeTarget(@Param('targetId') targetId: string) {
    return this.publishingService.removeTarget(targetId);
  }
}
