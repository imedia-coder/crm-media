import { Module } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { SubcontractorsController } from './subcontractors.controller';
import { SubcontractorsService } from './subcontractors.service';

@Module({
  imports: [TenancyModule, AuthModule],
  controllers: [SubcontractorsController],
  providers: [SubcontractorsService],
})
export class SubcontractorsModule {}
