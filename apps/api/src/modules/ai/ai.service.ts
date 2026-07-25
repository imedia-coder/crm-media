import { Injectable, NotFoundException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type { Response } from 'express';
import { TenantPrismaService } from '../../core/tenancy/tenant-prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

const MODEL = 'claude-opus-4-8';

const SYSTEM_PROMPT =
  "Tu es l'assistant IA intégré à crm MEDIA, une plateforme de gestion pour agences media/marketing. " +
  "Tu aides les membres de l'équipe interne à rédiger des emails et messages clients, résumer des informations, " +
  "brainstormer des idées de contenu ou de campagne, et répondre à leurs questions de travail au quotidien. " +
  'Réponds en français, de façon concise et directement exploitable, sauf si on te parle dans une autre langue.';

@Injectable()
export class AiService {
  private readonly client = new Anthropic();

  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  listConversations(userId: string) {
    return this.tenantPrisma.client.aiConversation.findMany({
      where: { userId },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversation(id: string, userId: string) {
    const conversation = await this.tenantPrisma.client.aiConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  async removeConversation(id: string, userId: string) {
    const conversation = await this.tenantPrisma.client.aiConversation.findUnique({ where: { id } });
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }
    await this.tenantPrisma.client.aiConversation.delete({ where: { id } });
  }

  /**
   * Streams the assistant's reply directly to the HTTP response as it's
   * generated (Anthropic's recommendation for any request that may produce
   * a long output). The user's message and the full assistant reply are
   * persisted before/after the stream so history survives a page reload.
   */
  async streamChat(dto: SendMessageDto, userId: string, res: Response): Promise<void> {
    const tenantId = this.tenantPrisma.tenantId;

    const conversation = dto.conversationId
      ? await this.getConversation(dto.conversationId, userId)
      : await this.tenantPrisma.client.aiConversation.create({
          data: { tenantId, userId, title: dto.message.slice(0, 80) },
          include: { messages: true },
        });

    await this.tenantPrisma.client.aiMessage.create({
      data: { conversationId: conversation.id, role: 'USER', content: dto.message },
    });

    const history = [...conversation.messages, { role: 'USER' as const, content: dto.message }].map((m) => ({
      role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }));

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('X-Conversation-Id', conversation.id);

    let fullText = '';
    let started = false;
    try {
      const stream = this.client.messages.stream({
        model: MODEL,
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        thinking: { type: 'adaptive' },
        messages: history,
      });
      stream.on('text', (delta) => {
        started = true;
        fullText += delta;
        res.write(delta);
      });
      await stream.finalMessage();
    } catch (err) {
      if (started) {
        // Partial answer already streamed to the client; can't turn this
        // into a clean error response now, just close the connection.
        res.end();
        return;
      }
      throw err;
    }

    await this.tenantPrisma.client.aiMessage.create({
      data: { conversationId: conversation.id, role: 'ASSISTANT', content: fullText },
    });
    await this.tenantPrisma.client.aiConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    res.end();
  }
}
