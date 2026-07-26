import { Module } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { ChannelsController } from './channels/channels.controller';
import { ChannelsService } from './channels/channels.service';
import { ConversationsController } from './conversations/conversations.controller';
import { ConversationsService } from './conversations/conversations.service';
import { WebhookController } from './webhook/webhook.controller';
import { WebhookService } from './webhook/webhook.service';
import { WhapiClientService } from './whapi-client.service';

@Module({
  imports: [TenancyModule, AuthModule],
  controllers: [ChannelsController, ConversationsController, WebhookController],
  providers: [ChannelsService, ConversationsService, WebhookService, WhapiClientService],
})
export class WhatsAppModule {}
