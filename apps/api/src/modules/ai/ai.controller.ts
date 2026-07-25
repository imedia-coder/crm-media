import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { AI_PERMISSIONS } from '../../core/auth/permissions.constants';
import type { AuthenticatedUser } from '../../core/auth/types/jwt-payload.interface';
import { AiService } from './ai.service';
import { SendMessageDto } from './dto/send-message.dto';

@RequirePermissions(AI_PERMISSIONS.ASSISTANT_USE)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.listConversations(user.id);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.aiService.getConversation(id, user.id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('conversations/:id')
  removeConversation(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.aiService.removeConversation(id, user.id);
  }

  @Post('chat')
  async chat(@Body() dto: SendMessageDto, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    await this.aiService.streamChat(dto, user.id, res);
  }
}
