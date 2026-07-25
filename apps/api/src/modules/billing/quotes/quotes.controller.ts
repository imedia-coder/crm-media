import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { BILLING_PERMISSIONS } from '../../../core/auth/permissions.constants';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { ListQuotesQuery } from './dto/list-quotes.query';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuotesService } from './quotes.service';

@Controller('billing/quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @RequirePermissions(BILLING_PERMISSIONS.QUOTES_READ)
  @Get()
  findAll(@Query() query: ListQuotesQuery) {
    return this.quotesService.findAll(query);
  }

  @RequirePermissions(BILLING_PERMISSIONS.QUOTES_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotesService.findOneOrThrow(id);
  }

  @RequirePermissions(BILLING_PERMISSIONS.QUOTES_READ)
  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.quotesService.renderPdf(id);
    res.set({ 'Content-Type': 'application/pdf' });
    return new StreamableFile(buffer);
  }

  @RequirePermissions(BILLING_PERMISSIONS.QUOTES_WRITE)
  @Post()
  create(@Body() dto: CreateQuoteDto) {
    return this.quotesService.create(dto);
  }

  @RequirePermissions(BILLING_PERMISSIONS.QUOTES_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.quotesService.update(id, dto);
  }

  @RequirePermissions(BILLING_PERMISSIONS.QUOTES_WRITE)
  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.quotesService.send(id);
  }

  @RequirePermissions(BILLING_PERMISSIONS.QUOTES_WRITE)
  @Post(':id/accept')
  accept(@Param('id') id: string) {
    return this.quotesService.accept(id);
  }

  @RequirePermissions(BILLING_PERMISSIONS.QUOTES_WRITE)
  @Post(':id/decline')
  decline(@Param('id') id: string) {
    return this.quotesService.decline(id);
  }

  @RequirePermissions(BILLING_PERMISSIONS.QUOTES_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotesService.remove(id);
  }
}
