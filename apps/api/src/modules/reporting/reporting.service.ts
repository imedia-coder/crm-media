import { Injectable } from '@nestjs/common';
import { computeTotals } from '../billing/money.util';
import { TenantPrismaService } from '../../core/tenancy/tenant-prisma.service';

@Injectable()
export class ReportingService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /**
   * Every query below reads from a table that has its own tenantId and
   * RLS policy (invoices, pipeline_stages+deals, projects+tasks+time_entries)
   * — never a bare payment/quoteLine/etc. lookup, which would have none of
   * that protection (see the security fix that prompted this module).
   */

  async revenueByMonth(months: number) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const invoices = await this.tenantPrisma.client.invoice.findMany({
      where: { payments: { some: { paidAt: { gte: since } } } },
      include: { payments: true },
    });

    const byMonth = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = new Date(since);
      d.setMonth(d.getMonth() + i);
      byMonth.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
    }
    for (const invoice of invoices) {
      for (const payment of invoice.payments) {
        if (payment.paidAt < since) continue;
        const key = `${payment.paidAt.getFullYear()}-${String(payment.paidAt.getMonth() + 1).padStart(2, '0')}`;
        if (byMonth.has(key)) {
          byMonth.set(key, byMonth.get(key)! + Number(payment.amount));
        }
      }
    }

    return Array.from(byMonth.entries()).map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }));
  }

  async pipelineConversion() {
    const stages = await this.tenantPrisma.client.pipelineStage.findMany({
      include: { deals: { select: { id: true, estimatedValue: true } } },
      orderBy: { order: 'asc' },
    });

    return stages.map((stage) => ({
      stageId: stage.id,
      name: stage.name,
      isWon: stage.isWon,
      isLost: stage.isLost,
      dealCount: stage.deals.length,
      totalValue: Math.round(stage.deals.reduce((sum, d) => sum + Number(d.estimatedValue ?? 0), 0) * 100) / 100,
    }));
  }

  async projectProfitability() {
    const projects = await this.tenantPrisma.client.project.findMany({
      where: { status: { notIn: ['ARCHIVED'] } },
      include: {
        company: { select: { id: true, name: true } },
        tasks: { include: { timeEntries: { select: { minutes: true } } } },
        invoices: { include: { lines: true, payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((project) => {
      const totalMinutes = project.tasks.reduce(
        (sum, task) => sum + task.timeEntries.reduce((s, t) => s + t.minutes, 0),
        0,
      );
      const doneTasks = project.tasks.filter((t) => t.status === 'DONE').length;
      const invoicedTotal = project.invoices.reduce((sum, inv) => sum + computeTotals(inv.lines).total, 0);
      const paidTotal = project.invoices.reduce(
        (sum, inv) => sum + inv.payments.reduce((s, p) => s + Number(p.amount), 0),
        0,
      );

      return {
        projectId: project.id,
        name: project.name,
        company: project.company?.name ?? null,
        status: project.status,
        budget: project.budget ? Number(project.budget) : null,
        hoursLogged: Math.round((totalMinutes / 60) * 10) / 10,
        taskCompletion: project.tasks.length > 0 ? Math.round((doneTasks / project.tasks.length) * 100) : 0,
        invoicedTotal: Math.round(invoicedTotal * 100) / 100,
        paidTotal: Math.round(paidTotal * 100) / 100,
      };
    });
  }
}
