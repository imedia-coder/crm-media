import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Chiffrement symétrique des jetons stockés (OAuth réseaux sociaux…).
 *
 * Format de sortie : `v1:<iv b64>:<tag b64>:<ciphertext b64>` (AES-256-GCM).
 * `decrypt` renvoie tel quel toute valeur sans préfixe `v1:` — ce qui couvre
 * le mode dev (clé absente) et la compat avec les jetons stockés en clair
 * ailleurs dans le code (ex. WhatsAppChannel.whapiToken).
 *
 * Clé : `TOKEN_ENCRYPTION_KEY`, 32 octets encodés en base64. Générer avec :
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */
@Injectable()
export class TokenCipherService {
  private readonly logger = new Logger(TokenCipherService.name);
  private readonly key: Buffer | null;

  constructor(config: ConfigService) {
    const raw = config.get<string>('TOKEN_ENCRYPTION_KEY');
    if (!raw) {
      this.key = null;
      this.logger.warn(
        'TOKEN_ENCRYPTION_KEY absente — les jetons sociaux sont stockés en clair (dev uniquement).',
      );
      return;
    }
    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      throw new Error(
        'TOKEN_ENCRYPTION_KEY doit faire 32 octets une fois décodée en base64',
      );
    }
    this.key = key;
  }

  encrypt(plain: string): string {
    if (!this.key) return plain;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
  }

  decrypt(stored: string): string {
    if (!stored.startsWith('v1:')) return stored;
    if (!this.key) {
      throw new Error('Jeton chiffré mais TOKEN_ENCRYPTION_KEY absente');
    }
    const [, ivB64, tagB64, ctB64] = stored.split(':');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(ctB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }
}
