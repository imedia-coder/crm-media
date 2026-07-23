import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './types/jwt-payload.interface';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';

@Controller()
export class MeController {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const companyCount = await this.tenantPrisma.client.company.count();
    return { user, companyCount };
  }
}
