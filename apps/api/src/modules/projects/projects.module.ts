import { Module } from '@nestjs/common';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';

@Module({
  imports: [TenancyModule],
  controllers: [ProjectsController, TasksController],
  providers: [ProjectsService, TasksService],
})
export class ProjectsModule {}
