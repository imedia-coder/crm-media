import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../../../core/notifications/notifications.service';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { AutomationService } from '../../automation/automation.service';
import { computeTotals, nextDocumentNumber, round2 } from '../money.util';
import { renderDocumentPdf } from '../pdf.util';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQuery } from './dto/list-invoices.query';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly notifications: NotificationsService,
    private readonly automation: AutomationService,
  ) {}

  // Called after the payment transaction has committed (never from inside
  // it — this uses its own separate mini-transaction via
  // TenantPrismaService, so nesting it inside an already-open one would
  // mean two transactions racing for connections, and if the outer one
  // ever rolled back afterwards this notification would already be sent).
  private async notifyIfNewlyPaid(invoiceId: string, isNowPaid: boolean) {
    if (!isNowPaid) return;
    const invoice = await this.tenantPrisma.client.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return;

    let managerId: string | null = null;
    if (invoice.projectId) {
      const project = await this.tenantPrisma.client.project.findUnique({ where: { id: invoice.projectId } });
      managerId = project?.managerId ?? null;
      if (managerId) {
        await this.notifications.notifyUser(managerId, 'INVOICE_PAID', `Facture payée : ${invoice.number}`, {
          link: '/dashboard/billing/invoices',
        });
      }
    }

    const company = await this.tenantPrisma.client.company.findUnique({ where: { id: invoice.companyId } });
    await this.automation.fire('INVOICE_PAID', {
      companyId: invoice.companyId,
      companyName: company?.name ?? null,
      ownerId: managerId,
      invoiceNumber: invoice.number,
    });
  }

  findAll(query: ListInvoicesQuery) {
    return this.tenantPrisma.client.invoice.findMany({
      where: {
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.status ? { status: query.status as never } : {}),
      },
      include: { company: true, lines: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(id: string) {
    const invoice = await this.tenantPrisma.client.invoice.findUnique({
      where: { id },
      include: { company: true, lines: true, payments: true, quote: true, project: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return this.withComputedFields(invoice);
  }

  private withComputedFields<T extends { lines: any[]; payments: { amount: unknown }[] }>(invoice: T) {
    const totals = computeTotals(invoice.lines);
    const amountPaid = round2(invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0));
    return { ...invoice, totals, amountPaid, amountDue: round2(totals.total - amountPaid) };
  }

  async create(dto: CreateInvoiceDto) {
    const tenantId = this.tenantPrisma.tenantId;
    return this.tenantPrisma.transaction(async (tx) => {
      const number = await nextDocumentNumber('FAC', (yearStart) =>
        tx.invoice.count({ where: { tenantId, createdAt: { gte: yearStart } } }),
      );
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          companyId: dto.companyId,
          quoteId: dto.quoteId,
          projectId: dto.projectId,
          currency: dto.currency ?? 'EUR',
          number,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          lines: {
            create: dto.lines.map((line) => ({
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              vatRate: line.vatRate ?? 20,
            })),
          },
        },
        include: { lines: true, payments: true },
      });
      return this.withComputedFields(invoice);
    });
  }

  async createFromQuote(quoteId: string) {
    const tenantId = this.tenantPrisma.tenantId;
    return this.tenantPrisma.transaction(async (tx) => {
      const quote = await tx.quote.findUnique({ where: { id: quoteId }, include: { lines: true } });
      if (!quote) throw new NotFoundException('Quote not found');
      if (quote.status !== 'ACCEPTED') {
        throw new ConflictException('Only an accepted quote can be converted to an invoice');
      }

      const number = await nextDocumentNumber('FAC', (yearStart) =>
        tx.invoice.count({ where: { tenantId, createdAt: { gte: yearStart } } }),
      );
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          companyId: quote.companyId,
          quoteId: quote.id,
          projectId: quote.projectId,
          currency: quote.currency,
          number,
          lines: {
            create: quote.lines.map((line) => ({
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              vatRate: line.vatRate,
            })),
          },
        },
        include: { lines: true, payments: true },
      });
      return this.withComputedFields(invoice);
    });
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const existing = await this.tenantPrisma.client.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Invoice not found');
    if (existing.status !== 'DRAFT') {
      throw new ConflictException('Only draft invoices can be edited');
    }

    return this.tenantPrisma.transaction(async (tx) => {
      if (dto.lines) {
        await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
      }
      const invoice = await tx.invoice.update({
        where: { id },
        data: {
          quoteId: dto.quoteId,
          projectId: dto.projectId,
          currency: dto.currency,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          ...(dto.lines
            ? {
                lines: {
                  create: dto.lines.map((line) => ({
                    description: line.description,
                    quantity: line.quantity,
                    unitPrice: line.unitPrice,
                    vatRate: line.vatRate ?? 20,
                  })),
                },
              }
            : {}),
        },
        include: { lines: true, payments: true },
      });
      return this.withComputedFields(invoice);
    });
  }

  async send(id: string) {
    const invoice = await this.tenantPrisma.client.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'DRAFT') {
      throw new ConflictException(`Invoice must be in status DRAFT (currently ${invoice.status})`);
    }
    return this.tenantPrisma.client.invoice.update({ where: { id }, data: { status: 'SENT' } });
  }

  async recordPayment(id: string, dto: RecordPaymentDto) {
    const result = await this.tenantPrisma.transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id }, include: { lines: true, payments: true } });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
        throw new ConflictException(`Cannot record a payment on a ${invoice.status.toLowerCase()} invoice`);
      }

      await tx.payment.create({
        data: { invoiceId: id, amount: dto.amount, method: dto.method, reference: dto.reference },
      });

      const totals = computeTotals(invoice.lines);
      const paidSoFar = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) + dto.amount;
      const updated = await tx.invoice.update({
        where: { id },
        data: paidSoFar >= totals.total ? { status: 'PAID' } : {},
        include: { lines: true, payments: true },
      });
      return this.withComputedFields(updated);
    });

    await this.notifyIfNewlyPaid(id, result.status === 'PAID');
    return result;
  }

  /**
   * One-click confirmation that the client has paid in full, for teams
   * that just want to tick a box rather than key in an exact amount —
   * records a single payment covering the full remaining balance.
   */
  async markAsPaid(id: string, method: RecordPaymentDto['method']) {
    const result = await this.tenantPrisma.transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id }, include: { lines: true, payments: true } });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
        throw new ConflictException(`Cannot record a payment on a ${invoice.status.toLowerCase()} invoice`);
      }

      const totals = computeTotals(invoice.lines);
      const paidSoFar = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = round2(totals.total - paidSoFar);
      if (remaining > 0) {
        await tx.payment.create({ data: { invoiceId: id, amount: remaining, method } });
      }

      const updated = await tx.invoice.update({
        where: { id },
        data: { status: 'PAID' },
        include: { lines: true, payments: true },
      });
      return this.withComputedFields(updated);
    });

    await this.notifyIfNewlyPaid(id, result.status === 'PAID');
    return result;
  }

  async remove(id: string) {
    const invoice = await this.tenantPrisma.client.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'DRAFT') {
      throw new ConflictException('Only draft invoices can be deleted');
    }
    await this.tenantPrisma.client.invoice.delete({ where: { id } });
  }

  async renderPdf(id: string): Promise<Buffer> {
    const invoice = await this.findOneOrThrow(id);
    const tenant = await this.tenantPrisma.client.tenant.findUnique({
      where: { id: this.tenantPrisma.tenantId },
    });
    if (!tenant) throw new BadRequestException('Tenant not found');

    return renderDocumentPdf({
      documentTypeLabel: 'Facture',
      number: invoice.number,
      tenantName: tenant.name,
      companyName: invoice.company.name,
      currency: invoice.currency,
      issuedAt: invoice.createdAt,
      dueDate: invoice.dueDate,
      lines: invoice.lines,
    });
  }
}
