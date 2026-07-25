import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { PROJECT_PERMISSIONS } from '../../../core/auth/permissions.constants';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQuery } from './dto/list-projects.query';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @RequirePermissions(PROJECT_PERMISSIONS.PROJECTS_READ)
  @Get()
  findAll(@Query() query: ListProjectsQuery) {
    return this.projectsService.findAll(query);
  }

  @RequirePermissions(PROJECT_PERMISSIONS.PROJECTS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOneOrThrow(id);
  }

  @RequirePermissions(PROJECT_PERMISSIONS.PROJECTS_WRITE)
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @RequirePermissions(PROJECT_PERMISSIONS.PROJECTS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @RequirePermissions(PROJECT_PERMISSIONS.PROJECTS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
