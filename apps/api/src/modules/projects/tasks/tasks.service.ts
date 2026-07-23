import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../../../core/notifications/notifications.service';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { AddDependencyDto } from './dto/add-dependency.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQuery } from './dto/list-tasks.query';
import { LogTimeDto } from './dto/log-time.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(query: ListTasksQuery) {
    return this.tenantPrisma.client.task.findMany({
      where: {
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
        ...(query.status ? { status: query.status as never } : {}),
      },
      include: { assignee: true, _count: { select: { subtasks: true, timeEntries: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneOrThrow(id: string) {
    const task = await this.tenantPrisma.client.task.findUnique({
      where: { id },
      include: {
        assignee: true,
        subtasks: true,
        dependsOn: { include: { dependsOnTask: true } },
        dependedBy: { include: { task: true } },
        timeEntries: { include: { user: true }, orderBy: { loggedAt: 'desc' } },
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(dto: CreateTaskDto) {
    const client = this.tenantPrisma.client;
    const project = await client.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');

    if (dto.parentTaskId) {
      const parent = await client.task.findUnique({ where: { id: dto.parentTaskId } });
      if (!parent || parent.projectId !== dto.projectId) {
        throw new BadRequestException('Parent task must belong to the same project');
      }
    }

    const task = await client.task.create({
      data: {
        tenantId: this.tenantPrisma.tenantId,
        projectId: dto.projectId,
        parentTaskId: dto.parentTaskId,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assigneeId: dto.assigneeId,
        estimatedHours: dto.estimatedHours,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });

    if (task.assigneeId) {
      await this.notifications.notifyUser(task.assigneeId, 'TASK_ASSIGNED', `Nouvelle tâche : ${task.title}`, {
        link: `/dashboard/projects/${task.projectId}`,
      });
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const existing = await this.findOneOrThrow(id);
    const task = await this.tenantPrisma.client.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });

    if (dto.assigneeId && dto.assigneeId !== existing.assigneeId) {
      await this.notifications.notifyUser(dto.assigneeId, 'TASK_ASSIGNED', `Nouvelle tâche : ${task.title}`, {
        link: `/dashboard/projects/${task.projectId}`,
      });
    }

    return task;
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.tenantPrisma.client.task.delete({ where: { id } });
  }

  async addDependency(id: string, dto: AddDependencyDto) {
    if (id === dto.dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }
    // Sequential, not Promise.all: each call to `.client` reserves its own
    // connection for the query's duration, and firing two concurrently
    // against the same underlying connection makes the driver choke.
    const client = this.tenantPrisma.client;
    const task = await client.task.findUnique({ where: { id } });
    const dependsOn = await client.task.findUnique({ where: { id: dto.dependsOnTaskId } });
    if (!task) throw new NotFoundException('Task not found');
    if (!dependsOn) throw new NotFoundException('Dependency task not found');
    if (task.projectId !== dependsOn.projectId) {
      throw new BadRequestException('Dependencies must belong to the same project');
    }
    return client.taskDependency.create({
      data: { taskId: id, dependsOnTaskId: dto.dependsOnTaskId },
    });
  }

  async removeDependency(id: string, dependsOnTaskId: string) {
    await this.tenantPrisma.client.taskDependency.deleteMany({
      where: { taskId: id, dependsOnTaskId },
    });
  }

  async logTime(id: string, userId: string, dto: LogTimeDto) {
    await this.findOneOrThrow(id);
    return this.tenantPrisma.client.timeEntry.create({
      data: {
        tenantId: this.tenantPrisma.tenantId,
        taskId: id,
        userId,
        minutes: dto.minutes,
        note: dto.note,
      },
    });
  }
}
