import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../core/auth/types/jwt-payload.interface';
import { ClientPortalGuard } from './client-portal.guard';
import { PortalService } from './portal.service';

@UseGuards(ClientPortalGuard)
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getMe(user.id, user.companyId as string);
  }

  @Get('projects')
  listProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.listProjects(user.companyId as string);
  }

  @Get('projects/:id')
  getProject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.portalService.getProjectOrThrow(user.companyId as string, id);
  }

  @Get('documents')
  listDocuments(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.listDocuments(user.companyId as string);
  }

  @Get('documents/:id/versions/:versionNumber/download')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const version = await this.portalService.getDownloadableVersionOrThrow(
      user.companyId as string,
      id,
      versionNumber,
    );
    res.set({
      'Content-Type': version.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(version.originalName)}"`,
    });
    return new StreamableFile(this.portalService.readStream(version.storageKey));
  }

  @Get('quotes')
  listQuotes(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.listQuotes(user.companyId as string);
  }

  @Get('quotes/:id/pdf')
  async quotePdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.portalService.renderQuotePdf(user.companyId as string, id);
    res.set({ 'Content-Type': 'application/pdf' });
    return new StreamableFile(buffer);
  }

  @Get('invoices')
  listInvoices(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.listInvoices(user.companyId as string);
  }

  @Get('invoices/:id')
  getInvoice(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.portalService.getInvoiceOrThrow(user.companyId as string, id);
  }

  @Get('invoices/:id/pdf')
  async invoicePdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.portalService.renderInvoicePdf(user.companyId as string, id);
    res.set({ 'Content-Type': 'application/pdf' });
    return new StreamableFile(buffer);
  }
}
