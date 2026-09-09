import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from '../../core/storage/storage.service';
import { PlatformPrismaService } from '../../core/prisma/platform-prisma.service';

/**
 * Transforme les entrées `mediaIds` d'une cible en URLs publiques exploitables
 * par les adaptateurs réseaux.
 *
 * - Une entrée déjà en `http(s)://` est renvoyée telle quelle.
 * - Sinon c'est un id de `MediaAsset` : on résout sa clé de stockage en URL
 *   publique (StorageService). Une entrée non résolvable est ignorée (log).
 *
 * Tourne côté système (cron/worker) → PlatformPrismaService. On vérifie que
 * l'asset appartient bien au même tenant que la cible.
 */
@Injectable()
export class MediaLinkService {
  private readonly logger = new Logger(MediaLinkService.name);

  constructor(
    private readonly prisma: PlatformPrismaService,
    private readonly storage: StorageService,
  ) {}

  async resolve(mediaIds: string[], tenantId: string): Promise<string[]> {
    const out: string[] = [];
    for (const entry of mediaIds) {
      if (/^https?:\/\//i.test(entry)) {
        out.push(entry);
        continue;
      }
      const asset = await this.prisma.mediaAsset.findUnique({
        where: { id: entry },
      });
      if (!asset || asset.tenantId !== tenantId) {
        this.logger.warn(`Média ${entry} introuvable ou hors tenant — ignoré.`);
        continue;
      }
      const url = this.storage.getPublicUrl(asset.storageKey);
      if (!url) {
        this.logger.warn(
          `Média ${entry} : pas d'URL publique (configurer MEDIA_PUBLIC_BASE ou un bucket public) — ignoré.`,
        );
        continue;
      }
      out.push(url);
    }
    return out;
  }
}
