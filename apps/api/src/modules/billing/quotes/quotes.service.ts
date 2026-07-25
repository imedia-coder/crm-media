import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../../../core/notifications/notifications.service';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { AutomationService } from '../../automation/automation.service';
import { computeTotals, nextDocumentNumber } from '../money.util';
import { renderDocumentPdf } from '../pdf.util';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { ListQuotesQuery } from './dto/list-quotes.query';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Injectable()
export class QuotesService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly notifications: NotificationsService,
    private readonly automation: AutomationService,
  ) {}

  findAll(query: ListQuotesQuery) {
    return this.tenantPrisma.client.quote.findMany({
      where: {
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.status ? { status: query.status as never } : {}),
      },
      include: { company: true, lines: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(id: string) {
    const quote = await this.tenantPrisma.client.quote.findUnique({
      where: { id },
      include: { company: true, lines: true, deal: true, project: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    return { ...quote, totals: computeTotals(quote.lines) };
  }

  async create(dto: CreateQuoteDto) {
    const tenantId = this.tenantPrisma.tenantId;
    return this.tenantPrisma.transaction(async (tx) => {
      const number = await nextDocumentNumber('DEV', (yearStart) =>
        tx.quote.count({ where: { tenantId, createdAt: { gte: yearStart } } }),
      );
      const quote = await tx.quote.create({
        data: {
          tenantId,
          companyId: dto.companyId,
          dealId: dto.dealId,
          projectId: dto.projectId,
          currency: dto.currency ?? 'EUR',
          number,
          lines: {
            create: dto.lines.map((line) => ({
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              vatRate: line.vatRate ?? 20,
            })),
          },
        },
        include: { lines: true },
      });
      return { ...quote, totals: computeTotals(quote.lines) };
    });
  }

  async update(id: string, dto: UpdateQuoteDto) {
    const existing = await this.tenantPrisma.client.quote.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Quote not found');
    if (existing.status !== 'DRAFT') {
      throw new ConflictException('Only draft quotes can be edited');
    }

    return this.tenantPrisma.transaction(async (tx) => {
      if (dto.lines) {
        await tx.quoteLine.deleteMany({ where: { quoteId: id } });
      }
      const quote = await tx.quote.update({
        where: { id },
        data: {
          dealId: dto.dealId,
          projectId: dto.projectId,
          currency: dto.currency,
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
        include: { lines: true },
      });
      return { ...quote, totals: computeTotals(quote.lines) };
    });
  }

  async send(id: string) {
    return this.transition(id, 'DRAFT', 'SENT');
  }

  async accept(id: string) {
    const quote = await this.transition(id, 'SENT', 'ACCEPTED');

    let deal: { ownerId: string | null; title: string } | null = null;
    if (quote.dealId) {
      deal = await this.tenantPrisma.client.deal.findUnique({ where: { id: quote.dealId } });
      if (deal?.ownerId) {
        await this.notifications.notifyUser(deal.ownerId, 'QUOTE_ACCEPTED', `Devis accepté : ${quote.number}`, {
          link: `/dashboard/billing/quotes`,
        });
      }
    }

    const company = await this.tenantPrisma.client.company.findUnique({ where: { id: quote.companyId } });
    await this.automation.fire('QUOTE_ACCEPTED', {
      companyId: quote.companyId,
      companyName: company?.name ?? null,
      ownerId: deal?.ownerId ?? null,
      dealTitle: deal?.title,
      quoteNumber: quote.number,
    });

    return quote;
  }

  async decline(id: string) {
    return this.transition(id, 'SENT', 'DECLINED');
  }

  private async transition(id: string, expectedStatus: string, nextStatus: string) {
    const quote = await this.tenantPrisma.client.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== expectedStatus) {
      throw new ConflictException(`Quote must be in status ${expectedStatus} (currently ${quote.status})`);
    }
    return this.tenantPrisma.client.quote.update({ where: { id }, data: { status: nextStatus as never } });
  }

  async remove(id: string) {
    const quote = await this.tenantPrisma.client.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'DRAFT') {
      throw new ConflictException('Only draft quotes can be deleted');
    }
    await this.tenantPrisma.client.quote.delete({ where: { id } });
  }

  async renderPdf(id: string): Promise<Buffer> {
    const quote = await this.findOneOrThrow(id);
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
}
