import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { MARKETING_PERMISSIONS } from '../../../core/auth/permissions.constants';
import type { AuthenticatedUser } from '../../../core/auth/types/jwt-payload.interface';
import { ListMediaQuery } from './dto/list-media.query';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaService } from './media.service';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

@Controller('marketing/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @RequirePermissions(MARKETING_PERMISSIONS.MEDIA_READ)
  @Get()
  findAll(@Query() query: ListMediaQuery) {
    return this.mediaService.findAll(query);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.MEDIA_WRITE)
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mediaService.upload(file, dto, user.id);
  }

  @RequirePermissions(MARKETING_PERMISSIONS.MEDIA_READ)
  @Get(':id/download')
  async download(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const asset = await this.mediaService.findOneOrThrow(id);
    res.set({
      'Content-Type': asset.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(asset.name)}"`,
    });
    return new StreamableFile(this.mediaService.readStream(asset.storageKey));
  }

  @RequirePermissions(MARKETING_PERMISSIONS.MEDIA_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
