import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { SOCIAL_PERMISSIONS } from '../../../core/auth/permissions.constants';
import type { AuthenticatedUser } from '../../../core/auth/types/jwt-payload.interface';
import { TikTokOAuthService } from './tiktok-oauth.service';

@Controller('social/tiktok')
export class TikTokOAuthController {
  constructor(private readonly tiktokOAuth: TikTokOAuthService) {}

  @RequirePermissions(SOCIAL_PERMISSIONS.ACCOUNTS_CONNECT)
  @Get('connect')
  async connect(
    @Query('companyId') companyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!companyId) throw new BadRequestException('companyId requis');
    const url = await this.tiktokOAuth.buildAuthUrl(user.tenantId, companyId);
    return { url };
  }

  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Res() res: Response,
  ) {
    const result = await this.tiktokOAuth.handleCallback({
      code,
      state,
      error,
      error_description: errorDescription,
    });
    res.redirect(this.tiktokOAuth.resultRedirectUrl(result));
  }
}
