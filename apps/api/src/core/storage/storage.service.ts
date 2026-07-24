import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { dirname, extname, join } from 'path';
import type { Readable } from 'stream';

interface StorageDriver {
  save(key: string, content: Buffer): Promise<void>;
  readStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
}

/** Default driver: files on the local disk, namespaced by tenant. */
class LocalDiskDriver implements StorageDriver {
  private readonly root = process.env.STORAGE_ROOT ?? join(process.cwd(), 'storage');

  async save(key: string, content: Buffer): Promise<void> {
    const path = this.resolve(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }

  async readStream(key: string): Promise<Readable> {
    return createReadStream(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }

  private resolve(key: string): string {
    return join(this.root, key);
  }
}

/**
 * S3-compatible driver (Cloudflare R2, AWS S3, or anything speaking the same
 * API). Enabled by setting STORAGE_DRIVER=s3; see .env.example for the
 * required S3_* variables. R2 uses region "auto" and its account-scoped
 * endpoint — no code difference from real S3 beyond those env values.
 */
class S3Driver implements StorageDriver {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET as string;
    this.client = new S3Client({
      region: process.env.S3_REGION ?? 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
      },
    });
  }

  async save(key: string, content: Buffer): Promise<void> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: content }));
  }

  async readStream(key: string): Promise<Readable> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return result.Body as Readable;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

/**
 * Storage for document/media files, namespaced by tenant so a path-traversal
 * or key-guessing bug can't cross tenants even before RLS would matter.
 * Callers only ever deal with opaque keys — which physical driver is behind
 * them (local disk today, S3/R2 when STORAGE_DRIVER=s3) is invisible here.
 */
@Injectable()
export class StorageService {
  private readonly driver: StorageDriver =
    process.env.STORAGE_DRIVER === 's3' ? new S3Driver() : new LocalDiskDriver();

  /**
   * `namespace` groups keys under a subfolder (e.g. a documentId, or just
   * "media" for the shared media library); `discriminator` disambiguates
   * within it (a document's version number, a timestamp, etc.).
   */
  buildKey(tenantId: string, namespace: string, discriminator: string | number, originalName: string): string {
    const ext = extname(originalName).slice(0, 20);
    return `${tenantId}/${namespace}/v${discriminator}-${randomUUID()}${ext}`;
  }

  save(key: string, content: Buffer): Promise<void> {
    return this.driver.save(key, content);
  }

  readStream(key: string): Promise<Readable> {
    return this.driver.readStream(key);
  }

  delete(key: string): Promise<void> {
    return this.driver.delete(key);
  }
}
