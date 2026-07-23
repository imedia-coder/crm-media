import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../../core/storage/storage.service';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { ListMediaQuery } from './dto/list-media.query';
import { UploadMediaDto } from './dto/upload-media.dto';

@Injectable()
export class MediaService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly storage: StorageService,
  ) {}

  findAll(query: ListMediaQuery) {
    return this.tenantPrisma.client.mediaAsset.findMany({
      where: {
        ...(query.campaignId ? { campaignId: query.campaignId } : {}),
        ...(query.contentItemId ? { contentItemId: query.contentItemId } : {}),
        ...(query.tag ? { tags: { has: query.tag } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upload(file: Express.Multer.File, dto: UploadMediaDto, uploaderId: string) {
    const tenantId = this.tenantPrisma.tenantId;
    const key = this.storage.buildKey(tenantId, 'media', Date.now(), file.originalname);
    await this.storage.save(key, file.buffer);

    return this.tenantPrisma.client.mediaAsset.create({
      data: {
        tenantId,
        name: dto.name ?? file.originalname,
        storageKey: key,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        tags: dto.tags ? dto.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        campaignId: dto.campaignId,
        contentItemId: dto.contentItemId,
        uploadedById: uploaderId,
      },
    });
  }

  readStream(storageKey: string) {
    return this.storage.readStream(storageKey);
  }

  async remove(id: string) {
    const asset = await this.tenantPrisma.client.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Media asset not found');
    await this.storage.delete(asset.storageKey);
    await this.tenantPrisma.client.mediaAsset.delete({ where: { id } });
  }

  async findOneOrThrow(id: string) {
    const asset = await this.tenantPrisma.client.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Media asset not found');
    return asset;
  }
}
