import { Module } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [TenancyModule, AuthModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
