import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { WHATSAPP_PERMISSIONS } from '../../../core/auth/permissions.constants';
import { ConversationsService } from './conversations.service';
import { LinkContactDto } from './dto/link-contact.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('whatsapp/conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @RequirePermissions(WHATSAPP_PERMISSIONS.CONVERSATIONS_READ)
  @Get()
  findAll() {
    return this.conversationsService.findAll();
  }

  @RequirePermissions(WHATSAPP_PERMISSIONS.CONVERSATIONS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOneOrThrow(id);
  }

  @RequirePermissions(WHATSAPP_PERMISSIONS.CONVERSATIONS_WRITE)
  @Post(':id/messages')
  sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.conversationsService.sendMessage(id, dto);
  }

  @RequirePermissions(WHATSAPP_PERMISSIONS.CONVERSATIONS_WRITE)
  @Patch(':id/link')
  link(@Param('id') id: string, @Body() dto: LinkContactDto) {
    return this.conversationsService.link(id, dto);
  }

  @RequirePermissions(WHATSAPP_PERMISSIONS.CONVERSATIONS_WRITE)
  @Delete(':id/link')
  unlink(@Param('id') id: string) {
    return this.conversationsService.unlink(id);
  }
}
