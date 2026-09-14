import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedOnly } from './decorators/authenticated-only.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { MfaCodeDto } from './dto/mfa-code.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from './token.service';
import type { AuthenticatedUser } from './types/jwt-payload.interface';

const REFRESH_COOKIE_NAME = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  // Le refresh token ne transite jamais par le JSON ni le localStorage cote
  // front : cookie httpOnly, illisible en JS (protection contre le vol par
  // XSS). sameSite: 'lax' suffit contre le CSRF ici — le cookie n'est de
  // toute facon jamais envoye sur une requete cross-site POST sous Lax, et
  // même consomme via CSRF l'attaquant ne peut pas lire la reponse (CORS
  // restreint a WEB_APP_URL). path: '/auth' — jamais envoye en dehors des
  // routes qui en ont besoin.
  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
    };
  }

  private setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...this.cookieOptions(),
      maxAge: this.tokenService.getRefreshTokenTtlMs(),
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
  }

  // Endpoints publics (pas de JWT a verifier) : la limite par IP est la
  // seule protection contre le brute-force / bourrage d'identifiants tant
  // qu'il n'y a pas de verrouillage de compte dedie.
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...rest } = await this.authService.register(dto);
    this.setRefreshCookie(res, refreshToken);
    return rest;
  }

  @Throttle({ default: { limit: 10, ttl: 300_000 } })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...rest } = await this.authService.login(dto);
    this.setRefreshCookie(res, refreshToken);
    return rest;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as
      string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const { refreshToken: rotated, ...rest } =
      await this.authService.refresh(refreshToken);
    this.setRefreshCookie(res, rotated);
    return rest;
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as
      string | undefined;
    if (refreshToken) await this.authService.logout(refreshToken);
    this.clearRefreshCookie(res);
  }

  // Gere son propre MFA/mot de passe — pas besoin d'une permission
  // specifique au-dela d'etre authentifie.
  @AuthenticatedOnly()
  @Post('mfa/setup')
  setupMfa(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.setupMfa(user.id);
  }

  // Limite le brute-force du code TOTP a 6 chiffres — authentifie mais
  // ne veut pas dire de confiance illimitee sur ce point d'entree.
  @AuthenticatedOnly()
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('mfa/enable')
  async enableMfa(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MfaCodeDto,
  ) {
    await this.authService.enableMfa(user.id, dto.code);
  }

  @AuthenticatedOnly()
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('mfa/disable')
  async disableMfa(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MfaCodeDto,
  ) {
    await this.authService.disableMfa(user.id, dto.code);
  }

  @AuthenticatedOnly()
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
