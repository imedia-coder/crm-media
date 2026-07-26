import { Injectable, NotFoundException } from '@nestjs/common';
import type { WhatsAppChannel } from '@prisma/client';
import { TenantPrismaService } from '../../../core/tenancy/tenant-prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

function toChannelDto(channel: WhatsAppChannel) {
  const { whapiToken: _whapiToken, webhookSecret, ...rest } = channel;
  const base = process.env.API_PUBLIC_URL ?? 'http://localhost:3001';
  return { ...rest, webhookUrl: `${base}/whatsapp/webhook/${webhookSecret}` };
}

@Injectable()
export class ChannelsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async findAll() {
    const channels = await this.tenantPrisma.client.whatsAppChannel.findMany({ orderBy: { createdAt: 'desc' } });
    return channels.map(toChannelDto);
  }

  async getOne(id: string) {
    return toChannelDto(await this.findOneOrThrow(id));
  }

  /**
   * Raw row, including the Whapi token — for internal use only (e.g.
   * ConversationsService sending a message). Never return this directly
   * from a controller; use getOne()/the mapped create()/update() instead.
   */
  async findOneOrThrow(id: string): Promise<WhatsAppChannel> {
    const channel = await this.tenantPrisma.client.whatsAppChannel.findUnique({ where: { id } });
    if (!channel) throw new NotFoundException('WhatsApp channel not found');
    return channel;
  }

  async create(dto: CreateChannelDto) {
    const channel = await this.tenantPrisma.client.whatsAppChannel.create({
      data: {
        tenantId: this.tenantPrisma.tenantId,
        name: dto.name,
        whapiToken: dto.whapiToken,
      },
    });
    return toChannelDto(channel);
  }

  async update(id: string, dto: UpdateChannelDto) {
    await this.findOneOrThrow(id);
    const channel = await this.tenantPrisma.client.whatsAppChannel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.whapiToken !== undefined ? { whapiToken: dto.whapiToken } : {}),
      },
    });
    return toChannelDto(channel);
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.tenantPrisma.client.whatsAppChannel.delete({ where: { id } });
  }
}
