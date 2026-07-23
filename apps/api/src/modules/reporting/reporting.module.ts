import { Module } from '@nestjs/common';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';

@Module({
  imports: [TenancyModule],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
