import { Controller, Get, Param, Post } from '@nestjs/common';
import { AuthenticatedOnly } from '../auth/decorators/authenticated-only.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { NotificationsService } from './notifications.service';

// Chacun ne voit/gere que ses propres notifications (user.id) — pas besoin
// d'une permission specifique au-dela d'etre authentifie.
@AuthenticatedOnly()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findMine(user.id);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return { count: await this.notificationsService.unreadCount(user.id) };
  }

  @Post(':id/read')
  async markRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.notificationsService.markRead(id, user.id);
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: AuthenticatedUser) {
    await this.notificationsService.markAllRead(user.id);
  }
}
