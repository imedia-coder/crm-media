import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { PROJECT_PERMISSIONS } from '../../../core/auth/permissions.constants';
import type { AuthenticatedUser } from '../../../core/auth/types/jwt-payload.interface';
import { AddDependencyDto } from './dto/add-dependency.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQuery } from './dto/list-tasks.query';
import { LogTimeDto } from './dto/log-time.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @RequirePermissions(PROJECT_PERMISSIONS.TASKS_READ)
  @Get()
  findAll(@Query() query: ListTasksQuery) {
    return this.tasksService.findAll(query);
  }

  @RequirePermissions(PROJECT_PERMISSIONS.TASKS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOneOrThrow(id);
  }

  @RequirePermissions(PROJECT_PERMISSIONS.TASKS_WRITE)
  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @RequirePermissions(PROJECT_PERMISSIONS.TASKS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @RequirePermissions(PROJECT_PERMISSIONS.TASKS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  @RequirePermissions(PROJECT_PERMISSIONS.TASKS_WRITE)
  @Post(':id/dependencies')
  addDependency(@Param('id') id: string, @Body() dto: AddDependencyDto) {
    return this.tasksService.addDependency(id, dto);
  }

  @RequirePermissions(PROJECT_PERMISSIONS.TASKS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/dependencies/:dependsOnTaskId')
  removeDependency(@Param('id') id: string, @Param('dependsOnTaskId') dependsOnTaskId: string) {
    return this.tasksService.removeDependency(id, dependsOnTaskId);
  }

  @RequirePermissions(PROJECT_PERMISSIONS.TASKS_WRITE)
  @Post(':id/time-entries')
  logTime(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: LogTimeDto) {
    return this.tasksService.logTime(id, user.id, dto);
  }
}
