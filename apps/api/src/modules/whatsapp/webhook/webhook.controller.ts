import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { WebhookService } from './webhook.service';

@Controller('whatsapp/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(':secret')
  async handle(@Param('secret') secret: string, @Body() payload: unknown) {
    await this.webhookService.handleIncoming(secret, payload);
    return { ok: true };
  }
}
