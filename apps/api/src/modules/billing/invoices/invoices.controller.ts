import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { BILLING_PERMISSIONS } from '../../../core/auth/permissions.constants';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQuery } from './dto/list-invoices.query';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { PaymentMethodDto, RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('billing/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @RequirePermissions(BILLING_PERMISSIONS.INVOICES_READ)
  @Get()
  findAll(@Query() query: ListInvoicesQuery) {
    return this.invoicesService.findAll(query);
  }

  @RequirePermissions(BILLING_PERMISSIONS.INVOICES_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOneOrThrow(id);
  }

  @RequirePermissions(BILLING_PERMISSIONS.INVOICES_READ)
  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.invoicesService.renderPdf(id);
    res.set({ 'Content-Type': 'application/pdf' });
    return new StreamableFile(buffer);
  }

  @RequirePermissions(BILLING_PERMISSIONS.INVOICES_WRITE)
  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @RequirePermissions(BILLING_PERMISSIONS.INVOICES_WRITE)
  @Post('from-quote/:quoteId')
  createFromQuote(@Param('quoteId') quoteId: string) {
    return this.invoicesService.createFromQuote(quoteId);
  }

  @RequirePermissions(BILLING_PERMISSIONS.INVOICES_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, dto);
  }

  @RequirePermissions(BILLING_PERMISSIONS.INVOICES_WRITE)
  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.invoicesService.send(id);
  }

  @RequirePermissions(BILLING_PERMISSIONS.INVOICES_WRITE)
  @Post(':id/payments')
  recordPayment(@Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.invoicesService.recordPayment(id, dto);
  }

  @RequirePermissions(BILLING_PERMISSIONS.INVOICES_WRITE)
  @Post(':id/mark-paid')
  markAsPaid(@Param('id') id: string, @Body() dto: MarkPaidDto) {
    return this.invoicesService.markAsPaid(id, dto.method ?? PaymentMethodDto.OTHER);
  }

  @RequirePermissions(BILLING_PERMISSIONS.INVOICES_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}
