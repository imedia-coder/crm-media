import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { WhatsAppConversation } from '@prisma/client';
import { PlatformPrismaService } from '../../../core/prisma/platform-prisma.service';
import { normalizePhone, phonesMatch } from '../phone-normalize.util';

interface WhapiInboundMessage {
  id?: string;
  from?: string;
  from_name?: string;
  text?: { body?: string };
  body?: string; // some payload variants put the text at the top level
}

interface WhapiWebhookPayload {
  messages?: WhapiInboundMessage[];
}

/**
 * No authenticated request/tenant context exists here (it's a public
 * webhook), so this uses PlatformPrismaService throughout and filters by
 * tenantId explicitly rather than issuing set_config on the shared pooled
 * connection PlatformPrismaService holds.
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly platformPrisma: PlatformPrismaService) {}

  async handleIncoming(secret: string, rawPayload: unknown): Promise<void> {
    const channel = await this.platformPrisma.whatsAppChannel.findUnique({ where: { webhookSecret: secret } });
    if (!channel) throw new NotFoundException('Unknown WhatsApp webhook');

    const payload = rawPayload as WhapiWebhookPayload;
    const messages = Array.isArray(payload?.messages) ? payload.messages : [];

    for (const msg of messages) {
      await this.processMessage(channel.id, channel.tenantId, msg);
    }

    if (channel.status === 'PENDING' && messages.length > 0) {
      await this.platformPrisma.whatsAppChannel.update({
        where: { id: channel.id },
        data: { status: 'CONNECTED' },
      });
    }
  }

  private async processMessage(channelId: string, tenantId: string, msg: WhapiInboundMessage): Promise<void> {
    const from = msg.from;
    const body = msg.text?.body ?? msg.body;
    if (!from || !body) {
      this.logger.debug('Ignoring WhatsApp webhook message with no from/body (likely a non-text event)');
      return;
    }

    const phoneNumber = normalizePhone(from);
    if (!phoneNumber) return;

    const conversation = await this.upsertConversation(channelId, tenantId, phoneNumber, msg.from_name);

    try {
      await this.platformPrisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          direction: 'INBOUND',
          status: 'DELIVERED',
          body,
          whapiMessageId: msg.id,
        },
      });
    } catch (err) {
      if (isUniqueConstraintViolation(err)) {
        this.logger.debug(`Ignoring duplicate WhatsApp webhook delivery for message ${msg.id}`);
        return;
      }
      throw err;
    }

    await this.platformPrisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), ...(msg.from_name ? { displayName: msg.from_name } : {}) },
    });
  }

  private async upsertConversation(
    channelId: string,
    tenantId: string,
    phoneNumber: string,
    displayName?: string,
  ): Promise<WhatsAppConversation> {
    const existing = await this.platformPrisma.whatsAppConversation.findUnique({
      where: { channelId_phoneNumber: { channelId, phoneNumber } },
    });
    if (existing) return existing;

    const contactId = await this.matchContact(tenantId, phoneNumber);
    return this.platformPrisma.whatsAppConversation.create({
      data: { tenantId, channelId, phoneNumber, displayName, contactId },
    });
  }

  /** No auto-create on no-match — leaves contactId null for manual linking from the UI. */
  private async matchContact(tenantId: string, phoneNumber: string): Promise<string | null> {
    const contacts = await this.platformPrisma.contact.findMany({
      where: { tenantId, phone: { not: null } },
      select: { id: true, phone: true },
    });
    const matches = contacts.filter((c) => c.phone && phonesMatch(c.phone, phoneNumber));
    return matches.length === 1 ? matches[0].id : null;
  }
}

function isUniqueConstraintViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}
