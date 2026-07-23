import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { TenancyModule } from './core/tenancy/tenancy.module';
import { CrmModule } from './modules/crm/crm.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, TenancyModule, AuthModule, CrmModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
