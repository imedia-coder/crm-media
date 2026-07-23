import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CRM_PERMISSIONS } from '../../../core/auth/permissions.constants';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { CreatePipelineStageDto } from './dto/create-pipeline-stage.dto';
import { ReorderPipelineStagesDto } from './dto/reorder-pipeline-stages.dto';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto';
import { PipelineStagesService } from './pipeline-stages.service';

@Controller('crm/pipeline-stages')
export class PipelineStagesController {
  constructor(private readonly pipelineStagesService: PipelineStagesService) {}

  @RequirePermissions(CRM_PERMISSIONS.DEALS_READ)
  @Get()
  findAll() {
    return this.pipelineStagesService.findAll();
  }

  @RequirePermissions(CRM_PERMISSIONS.PIPELINE_MANAGE)
  @Post()
  create(@Body() dto: CreatePipelineStageDto) {
    return this.pipelineStagesService.create(dto);
  }

  @RequirePermissions(CRM_PERMISSIONS.PIPELINE_MANAGE)
  @Post('reorder')
  reorder(@Body() dto: ReorderPipelineStagesDto) {
    return this.pipelineStagesService.reorder(dto);
  }

  @RequirePermissions(CRM_PERMISSIONS.PIPELINE_MANAGE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePipelineStageDto) {
    return this.pipelineStagesService.update(id, dto);
  }

  @RequirePermissions(CRM_PERMISSIONS.PIPELINE_MANAGE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pipelineStagesService.remove(id);
  }
}
