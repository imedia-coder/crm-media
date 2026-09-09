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
import { MetaOAuthService } from './meta-oauth.service';

@Controller('social/meta')
export class MetaOAuthController {
  constructor(private readonly metaOAuth: MetaOAuthService) {}

  /**
   * Renvoie l'URL de la boîte de dialogue Facebook. Le front (qui porte le JWT
   * dans un en-tête, pas un cookie) fait ensuite `window.location = url`. Le
   * contexte tenant/client est porté par le `state` signé.
   */
  @RequirePermissions(SOCIAL_PERMISSIONS.ACCOUNTS_CONNECT)
  @Get('connect')
  async connect(
    @Query('companyId') companyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!companyId) throw new BadRequestException('companyId requis');
    const url = await this.metaOAuth.buildAuthUrl(user.tenantId, companyId);
    return { url };
  }

  /**
   * Retour de Facebook (redirection navigateur, sans en-tête d'auth) : on
   * échange le code, on enregistre les comptes, puis on renvoie vers l'app web.
   */
  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const result = await this.metaOAuth.handleCallback({ code, state, error });
    res.redirect(this.metaOAuth.resultRedirectUrl(result));
  }
}
