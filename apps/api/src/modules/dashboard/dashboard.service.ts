import { Injectable } from '@nestjs/common';
import { computeTotals } from '../billing/money.util';
import { TenantPrismaService } from '../../core/tenancy/tenant-prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async getSummary() {
    const now = new Date();

    // A single Prisma transaction reserves one DB connection for its whole
    // lifetime, so every query below MUST be awaited one at a time — firing
    // them concurrently (Promise.all) sends overlapping commands down the
    // same connection, which the driver rejects.
    return this.tenantPrisma.transaction(async (tx) => {
      const totalCompanies = await tx.company.count();
      const totalClients = await tx.company.count({ where: { isClient: true } });
      const activeProjects = await tx.project.count({
        where: { status: { in: ['PLANNED', 'IN_PROGRESS', 'ON_HOLD'] } },
      });
      const openDeals = await tx.deal.findMany({
        where: { stage: { isWon: false, isLost: false } },
        select: { estimatedValue: true },
      });
      const unpaidInvoices = await tx.invoice.findMany({
        where: { status: { in: ['SENT', 'OVERDUE'] } },
        include: { lines: true, payments: true },
      });
      const overdueInvoicesCount = await tx.invoice.count({ where: { status: 'OVERDUE' } });
      const upcomingAppointments = await tx.appointment.findMany({
        where: { startAt: { gte: now } },
        include: { project: { select: { id: true, name: true } }, company: { select: { id: true, name: true } } },
        orderBy: { startAt: 'asc' },
        take: 5,
      });
      const upcomingTaskDeadlines = await tx.task.findMany({
        where: { dueDate: { gte: now }, status: { not: 'DONE' } },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      });
      const upcomingProjectDeadlines = await tx.project.findMany({
        where: { dueDate: { gte: now }, status: { notIn: ['DONE', 'ARCHIVED'] } },
        include: { company: { select: { id: true, name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      });

      const openDealsValue = openDeals.reduce((sum, d) => sum + Number(d.estimatedValue ?? 0), 0);
      const unpaidInvoicesTotal = unpaidInvoices.reduce((sum, invoice) => {
        const totals = computeTotals(invoice.lines);
        const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
        return sum + Math.max(totals.total - paid, 0);
      }, 0);

      return {
        stats: {
          totalCompanies,
          totalClients,
          activeProjects,
          openDealsCount: openDeals.length,
          openDealsValue,
          unpaidInvoicesTotal,
          overdueInvoicesCount,
        },
        upcomingAppointments,
        upcomingTaskDeadlines,
        upcomingProjectDeadlines,
      };
    });
  }
}
