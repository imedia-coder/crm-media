import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ADMIN_PERMISSIONS } from '../auth/permissions.constants';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { RetentionService } from './retention.service';

@Controller('admin/retention')
export class RetentionController {
  constructor(private readonly retentionService: RetentionService) {}

  @RequirePermissions(ADMIN_PERMISSIONS.RETENTION_RUN)
  @HttpCode(HttpStatus.OK)
  @Post('purge')
  purge(@CurrentUser() user: AuthenticatedUser) {
    return this.retentionService.purgeForTenant(user.tenantId);
  }
}
