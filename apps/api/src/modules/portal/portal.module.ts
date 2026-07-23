import { Module } from '@nestjs/common';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { ClientPortalGuard } from './client-portal.guard';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

@Module({
  imports: [TenancyModule],
  controllers: [PortalController],
  providers: [PortalService, ClientPortalGuard],
})
export class PortalModule {}
