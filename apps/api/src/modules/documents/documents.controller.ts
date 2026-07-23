import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { DOCUMENT_PERMISSIONS } from '../../core/auth/permissions.constants';
import type { AuthenticatedUser } from '../../core/auth/types/jwt-payload.interface';
import { DocumentsService } from './documents.service';
import { ListDocumentsQuery } from './dto/list-documents.query';
import { UploadDocumentDto } from './dto/upload-document.dto';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @RequirePermissions(DOCUMENT_PERMISSIONS.DOCUMENTS_READ)
  @Get()
  findAll(@Query() query: ListDocumentsQuery) {
    return this.documentsService.findAll(query);
  }

  @RequirePermissions(DOCUMENT_PERMISSIONS.DOCUMENTS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOneOrThrow(id);
  }

  @RequirePermissions(DOCUMENT_PERMISSIONS.DOCUMENTS_WRITE)
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.upload(file, dto, user.id);
  }

  @RequirePermissions(DOCUMENT_PERMISSIONS.DOCUMENTS_WRITE)
  @Post(':id/versions')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
  addVersion(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.addVersion(id, file, user.id);
  }

  @RequirePermissions(DOCUMENT_PERMISSIONS.DOCUMENTS_READ)
  @Get(':id/versions/:versionNumber/download')
  async download(
    @Param('id') id: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const version = await this.documentsService.getVersionOrThrow(id, versionNumber);
    res.set({
      'Content-Type': version.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(version.originalName)}"`,
    });
    return new StreamableFile(this.documentsService.readStream(version.storageKey));
  }

  @RequirePermissions(DOCUMENT_PERMISSIONS.DOCUMENTS_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
