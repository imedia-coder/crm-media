import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { RetentionModule } from './core/retention/retention.module';
import { StorageModule } from './core/storage/storage.module';
import { TenancyModule } from './core/tenancy/tenancy.module';
import { AiModule } from './modules/ai/ai.module';
import { AutomationModule } from './modules/automation/automation.module';
import { BillingModule } from './modules/billing/billing.module';
import { CrmModule } from './modules/crm/crm.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { PlanningModule } from './modules/planning/planning.module';
import { PortalModule } from './modules/portal/portal.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
    TenancyModule,
    NotificationsModule,
    AuthModule,
    CrmModule,
    ProjectsModule,
    DocumentsModule,
    BillingModule,
    PortalModule,
    PlanningModule,
    DashboardModule,
    MarketingModule,
    ReportingModule,
    UsersModule,
    RetentionModule,
    AiModule,
    AutomationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
