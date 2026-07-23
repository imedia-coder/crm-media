import { Controller, Get } from '@nestjs/common';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { DASHBOARD_PERMISSIONS } from '../../core/auth/permissions.constants';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @RequirePermissions(DASHBOARD_PERMISSIONS.VIEW)
  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }
}
