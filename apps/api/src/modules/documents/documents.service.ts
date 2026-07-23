import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../core/storage/storage.service';
import { TenantPrismaService } from '../../core/tenancy/tenant-prisma.service';
import { ListDocumentsQuery } from './dto/list-documents.query';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly storage: StorageService,
  ) {}

  findAll(query: ListDocumentsQuery) {
    return this.tenantPrisma.client.document.findMany({
      where: query.projectId ? { projectId: query.projectId } : {},
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(id: string) {
    const document = await this.tenantPrisma.client.document.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, include: { uploadedBy: true } },
      },
    });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async upload(file: Express.Multer.File, dto: UploadDocumentDto, uploaderId: string) {
    const tenantId = this.tenantPrisma.tenantId;
    return this.tenantPrisma.transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          tenantId,
          projectId: dto.projectId,
          name: dto.name ?? file.originalname,
        },
      });
      const key = this.storage.buildKey(tenantId, document.id, 1, file.originalname);
      await this.storage.save(key, file.buffer);
      const version = await tx.documentVersion.create({
        data: {
          documentId: document.id,
          versionNumber: 1,
          storageKey: key,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          uploadedById: uploaderId,
        },
      });
      return { ...document, versions: [version] };
    });
  }

  async addVersion(documentId: string, file: Express.Multer.File, uploaderId: string) {
    const tenantId = this.tenantPrisma.tenantId;
    return this.tenantPrisma.transaction(async (tx) => {
      const document = await tx.document.findUnique({
        where: { id: documentId },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      });
      if (!document) throw new NotFoundException('Document not found');

      const nextVersionNumber = (document.versions[0]?.versionNumber ?? 0) + 1;
      const key = this.storage.buildKey(tenantId, documentId, nextVersionNumber, file.originalname);
      await this.storage.save(key, file.buffer);

      return tx.documentVersion.create({
        data: {
          documentId,
          versionNumber: nextVersionNumber,
          storageKey: key,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          uploadedById: uploaderId,
        },
      });
    });
  }

  async getVersionOrThrow(documentId: string, versionNumber: number) {
    // documentVersion has no tenantId of its own (protected transitively
    // via its parent document), so looking it up by documentId+versionNumber
    // directly would return another tenant's file if you knew/guessed its
    // documentId — confirming the parent exists first is what actually
    // enforces tenant isolation here, via the RLS-protected `document` table.
    await this.findOneOrThrow(documentId);
    const version = await this.tenantPrisma.client.documentVersion.findUnique({
      where: { documentId_versionNumber: { documentId, versionNumber } },
    });
    if (!version) throw new NotFoundException('Document version not found');
    return version;
  }

  readStream(storageKey: string) {
    return this.storage.readStream(storageKey);
  }

  async remove(id: string) {
    const document = await this.findOneOrThrow(id);
    await Promise.all(document.versions.map((v) => this.storage.delete(v.storageKey)));
    await this.tenantPrisma.client.document.delete({ where: { id } });
  }
}
