import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../core/auth/auth.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { MetaOAuthController } from './meta/meta-oauth.controller';
import { MetaOAuthService } from './meta/meta-oauth.service';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { SocialTokenService } from './social-token.service';
import { TikTokOAuthController } from './tiktok/tiktok-oauth.controller';
import { TikTokOAuthService } from './tiktok/tiktok-oauth.service';

@Module({
  imports: [TenancyModule, AuthModule, JwtModule.register({})],
  controllers: [SocialController, MetaOAuthController, TikTokOAuthController],
  providers: [
    SocialService,
    MetaOAuthService,
    TikTokOAuthService,
    SocialTokenService,
  ],
  exports: [
    SocialService,
    MetaOAuthService,
    TikTokOAuthService,
    SocialTokenService,
  ],
})
export class SocialModule {}
