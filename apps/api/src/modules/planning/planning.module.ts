import { Module } from '@nestjs/common';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [TenancyModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class PlanningModule {}
