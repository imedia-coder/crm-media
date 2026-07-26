import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { ChannelsService } from '../channels/channels.service';
import { WhapiClientService } from '../whapi-client.service';
import { LinkContactDto } from './dto/link-contact.dto';
import { SendMessageDto } from './dto/send-message.dto';

const CONTACT_SELECT = { id: true, firstName: true, lastName: true } as const;

@Injectable()
export class ConversationsService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly channelsService: ChannelsService,
    private readonly whapiClient: WhapiClientService,
  ) {}

  findAll() {
    return this.tenantPrisma.client.whatsAppConversation.findMany({
      orderBy: { lastMessageAt: 'desc' },
      include: { contact: { select: CONTACT_SELECT } },
    });
  }

  async findOneOrThrow(id: string) {
    const conversation = await this.tenantPrisma.client.whatsAppConversation.findUnique({
      where: { id },
      include: {
        contact: { select: CONTACT_SELECT },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async sendMessage(id: string, dto: SendMessageDto) {
    const conversation = await this.findExistingConversation(id);
    // Raw channel row (includes the Whapi token) — internal use only.
    const channel = await this.channelsService.findOneOrThrow(conversation.channelId);

    let whapiMessageId: string | undefined;
    let status: 'SENT' | 'FAILED' = 'SENT';
    try {
      const result = await this.whapiClient.sendTextMessage(channel.whapiToken, conversation.phoneNumber, dto.body);
      whapiMessageId = result.whapiMessageId;
    } catch {
      // Still persist the message below so the compose action isn't
      // silently dropped from the user's point of view — the FAILED status
      // surfaces the problem in the UI instead.
      status = 'FAILED';
    }

    return this.tenantPrisma.transaction(async (tx) => {
      const message = await tx.whatsAppMessage.create({
        data: { conversationId: id, direction: 'OUTBOUND', status, body: dto.body, whapiMessageId },
      });
      await tx.whatsAppConversation.update({ where: { id }, data: { lastMessageAt: new Date() } });
      return message;
    });
  }

  async link(id: string, dto: LinkContactDto) {
    await this.findExistingConversation(id);
    return this.tenantPrisma.client.whatsAppConversation.update({
      where: { id },
      data: { contactId: dto.contactId },
      include: { contact: { select: CONTACT_SELECT } },
    });
  }

  async unlink(id: string) {
    await this.findExistingConversation(id);
    return this.tenantPrisma.client.whatsAppConversation.update({
      where: { id },
      data: { contactId: null },
    });
  }

  private async findExistingConversation(id: string) {
    const conversation = await this.tenantPrisma.client.whatsAppConversation.findUnique({ where: { id } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }
}
