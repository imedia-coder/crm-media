import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { CryptoModule } from './core/crypto/crypto.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { RetentionModule } from './core/retention/retention.module';
import { StorageModule } from './core/storage/storage.module';
import { TenancyModule } from './core/tenancy/tenancy.module';
import { AiModule } from './modules/ai/ai.module';
import { AutomationModule } from './modules/automation/automation.module';
import { CrmModule } from './modules/crm/crm.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { PublishingModule } from './modules/publishing/publishing.module';
import { SocialModule } from './modules/social/social.module';
import { UsersModule } from './modules/users/users.module';

/**
 * Périmètre "Iniciativas Content" (voir docs/VISION-INICIATIVAS-CONTENT.md).
 * Les modules hors périmètre restent dans le dépôt mais ne sont plus chargés :
 * billing, projects, documents, planning, whatsapp, subcontractors, portal,
 * reporting. Réactivation = ré-ajouter l'import ici.
 * AutomationModule reste chargé car CrmModule en dépend (deals.service).
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Limite globale genereuse (usage normal de l'app) — les endpoints
    // sensibles (login, mfa, changement de mot de passe) ont leur propre
    // limite plus stricte via @Throttle(), voir auth.controller.ts.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    CryptoModule,
    StorageModule,
    TenancyModule,
    NotificationsModule,
    AuthModule,
    CrmModule,
    DashboardModule,
    MarketingModule,
    UsersModule,
    RetentionModule,
    AiModule,
    AutomationModule,
    SocialModule,
    PublishingModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
