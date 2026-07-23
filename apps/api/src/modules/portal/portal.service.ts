import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { computeTotals } from '../billing/money.util';
import { renderDocumentPdf } from '../billing/pdf.util';
import { StorageService } from '../../core/storage/storage.service';
import { TenantPrismaService } from '../../core/tenancy/tenant-prisma.service';

@Injectable()
export class PortalService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly storage: StorageService,
  ) {}

  async getMe(userId: string, companyId: string) {
    // Sequential, not Promise.all — see TenantPrismaService for why
    // concurrent calls through `.client` can't share the same connection.
    const user = await this.tenantPrisma.client.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    const company = await this.tenantPrisma.client.company.findUniqueOrThrow({ where: { id: companyId } });
    return { user, company };
  }

  listProjects(companyId: string) {
    return this.tenantPrisma.client.project.findMany({
      where: { companyId },
      include: { manager: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectOrThrow(companyId: string, projectId: string) {
    const project = await this.tenantPrisma.client.project.findFirst({
      where: { id: projectId, companyId },
      include: {
        manager: { select: { firstName: true, lastName: true, email: true } },
        tasks: { select: { id: true, title: true, status: true, dueDate: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  listDocuments(companyId: string) {
    return this.tenantPrisma.client.document.findMany({
      where: { project: { companyId } },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDownloadableVersionOrThrow(companyId: string, documentId: string, versionNumber: number) {
    const version = await this.tenantPrisma.client.documentVersion.findFirst({
      where: {
        versionNumber,
        documentId,
        document: { project: { companyId } },
      },
    });
    if (!version) throw new NotFoundException('Document version not found');
    return version;
  }

  readStream(storageKey: string) {
    return this.storage.readStream(storageKey);
  }

  listQuotes(companyId: string) {
    return this.tenantPrisma.client.quote.findMany({
      where: { companyId, status: { not: 'DRAFT' } },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getOwnQuoteOrThrow(companyId: string, quoteId: string) {
    const quote = await this.tenantPrisma.client.quote.findFirst({
      where: { id: quoteId, companyId, status: { not: 'DRAFT' } },
      include: { lines: true, company: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async renderQuotePdf(companyId: string, quoteId: string): Promise<Buffer> {
    const quote = await this.getOwnQuoteOrThrow(companyId, quoteId);
    const tenant = await this.tenantPrisma.client.tenant.findUnique({
      where: { id: this.tenantPrisma.tenantId },
    });
    if (!tenant) throw new BadRequestException('Tenant not found');
    return renderDocumentPdf({
      documentTypeLabel: 'Devis',
      number: quote.number,
      tenantName: tenant.name,
      companyName: quote.company.name,
      currency: quote.currency,
      issuedAt: quote.createdAt,
      lines: quote.lines,
    });
  }

  listInvoices(companyId: string) {
    return this.tenantPrisma.client.invoice.findMany({
      where: { companyId, status: { not: 'DRAFT' } },
      include: { lines: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getOwnInvoiceOrThrow(companyId: string, invoiceId: string) {
    const invoice = await this.tenantPrisma.client.invoice.findFirst({
      where: { id: invoiceId, companyId, status: { not: 'DRAFT' } },
      include: { lines: true, payments: true, company: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async getInvoiceOrThrow(companyId: string, invoiceId: string) {
    const invoice = await this.getOwnInvoiceOrThrow(companyId, invoiceId);
    const totals = computeTotals(invoice.lines);
    const amountPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return { ...invoice, totals, amountPaid, amountDue: totals.total - amountPaid };
  }

  async renderInvoicePdf(companyId: string, invoiceId: string): Promise<Buffer> {
    const invoice = await this.getOwnInvoiceOrThrow(companyId, invoiceId);
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
