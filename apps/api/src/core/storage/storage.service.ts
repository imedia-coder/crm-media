import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { dirname, extname, join } from 'path';

/**
 * Local-disk storage for document files, namespaced by tenant so a path
 * traversal or key-guessing bug can't cross tenants even before RLS would
 * matter. Swappable for an S3-compatible implementation later (Phase 3)
 * behind this same interface — callers only deal with opaque keys.
 */
@Injectable()
export class StorageService {
  private readonly root = process.env.STORAGE_ROOT ?? join(process.cwd(), 'storage');

  /**
   * `namespace` groups keys under a subfolder (e.g. a documentId, or just
   * "media" for the shared media library); `discriminator` disambiguates
   * within it (a document's version number, a timestamp, etc.).
   */
  buildKey(tenantId: string, namespace: string, discriminator: string | number, originalName: string): string {
    const ext = extname(originalName).slice(0, 20);
    return `${tenantId}/${namespace}/v${discriminator}-${randomUUID()}${ext}`;
  }

  async save(key: string, content: Buffer): Promise<void> {
    const path = this.resolve(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }

  readStream(key: string) {
    return createReadStream(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }

  private resolve(key: string): string {
    return join(this.root, key);
  }
}
