import { Injectable, NotFoundException } from '@nestjs/common';
import type { AutomationTrigger, Prisma } from '@prisma/client';
import { NotificationsService } from '../../core/notifications/notifications.service';
import { TenantPrismaService } from '../../core/tenancy/tenant-prisma.service';
import { AutomationAction, AutomationContext, renderTemplate } from './automation-action.types';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Injectable()
export class AutomationService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll() {
    return this.tenantPrisma.client.automationRule.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOneOrThrow(id: string) {
    const rule = await this.tenantPrisma.client.automationRule.findUnique({
      where: { id },
      include: { runs: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!rule) throw new NotFoundException('Automation rule not found');
    return rule;
  }

  create(dto: CreateRuleDto) {
    return this.tenantPrisma.client.automationRule.create({
      data: {
        tenantId: this.tenantPrisma.tenantId,
        name: dto.name,
        trigger: dto.trigger,
        isActive: dto.isActive ?? true,
        actions: dto.actions as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async update(id: string, dto: UpdateRuleDto) {
    await this.findOneOrThrow(id);
    return this.tenantPrisma.client.automationRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.trigger !== undefined ? { trigger: dto.trigger } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.actions !== undefined ? { actions: dto.actions as unknown as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.tenantPrisma.client.automationRule.delete({ where: { id } });
  }

  /**
   * Called by feature services AFTER their own transaction has committed
   * (same rule as Notifications: never fire mid-transaction, to avoid
   * nested-transaction/rollback races on the shared tenant connection).
   * Never throws — a broken rule shouldn't fail the request that
   * triggered it; failures are recorded in the rule's run log instead.
   */
  async fire(trigger: AutomationTrigger, context: AutomationContext): Promise<void> {
    const rules = await this.tenantPrisma.client.automationRule.findMany({
      where: { trigger, isActive: true },
    });
    for (const rule of rules) {
      await this.executeRule(rule.id, rule.actions as unknown as AutomationAction[], context);
    }
  }

  private async executeRule(ruleId: string, actions: AutomationAction[], context: AutomationContext): Promise<void> {
    const log: string[] = [];
    let createdProjectId: string | null = null;
    let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';

    try {
      for (const action of actions) {
        switch (action.type) {
          case 'CREATE_PROJECT': {
            const project = await this.tenantPrisma.client.project.create({
              data: {
                tenantId: this.tenantPrisma.tenantId,
                name: renderTemplate(action.config.nameTemplate, context) || 'Nouveau projet',
                companyId: context.companyId ?? undefined,
                status: 'PLANNED',
              },
            });
            createdProjectId = project.id;
            log.push(`Projet créé : "${project.name}"`);
            break;
          }
          case 'CREATE_TASK': {
            const projectId = action.config.useCreatedProject ? createdProjectId : (action.config.projectId ?? null);
            if (!projectId) {
              log.push('Tâche ignorée : aucun projet cible (activez "utiliser le projet créé" ou choisissez un projet).');
              break;
            }
            const task = await this.tenantPrisma.client.task.create({
              data: {
                tenantId: this.tenantPrisma.tenantId,
                projectId,
                title: renderTemplate(action.config.titleTemplate, context) || 'Nouvelle tâche',
              },
            });
            log.push(`Tâche créée : "${task.title}"`);
            break;
          }
          case 'SEND_NOTIFICATION': {
            if (!context.ownerId) {
              log.push('Notification ignorée : aucun destinataire identifié pour cet événement.');
              break;
            }
            await this.notifications.notifyUser(
              context.ownerId,
              'GENERIC',
              renderTemplate(action.config.titleTemplate, context) || 'Automatisation déclenchée',
            );
            log.push('Notification envoyée.');
            break;
          }
        }
      }
    } catch (err) {
      status = 'FAILED';
      log.push(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    }

    await this.tenantPrisma.client.automationRun.create({
      data: {
        ruleId,
        status,
        triggerData: context as unknown as Prisma.InputJsonValue,
        resultLog: log.join('\n'),
      },
    });
  }
}
