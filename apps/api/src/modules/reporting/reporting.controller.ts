import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { DASHBOARD_PERMISSIONS } from '../../core/auth/permissions.constants';
import { RevenueQuery } from './dto/revenue-query.dto';
import { ReportingService } from './reporting.service';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @RequirePermissions(DASHBOARD_PERMISSIONS.VIEW)
  @Get('revenue')
  revenue(@Query() query: RevenueQuery) {
    return this.reportingService.revenueByMonth(query.months ?? 12);
  }

  @RequirePermissions(DASHBOARD_PERMISSIONS.VIEW)
  @Get('pipeline')
  pipeline() {
    return this.reportingService.pipelineConversion();
  }

  @RequirePermissions(DASHBOARD_PERMISSIONS.VIEW)
  @Get('projects')
  projects() {
    return this.reportingService.projectProfitability();
  }
}
