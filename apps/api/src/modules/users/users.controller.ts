import { Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { USER_PERMISSIONS } from '../../core/auth/permissions.constants';
import type { AuthenticatedUser } from '../../core/auth/types/jwt-payload.interface';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermissions(USER_PERMISSIONS.USERS_READ)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @RequirePermissions(USER_PERMISSIONS.USERS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneOrThrow(id);
  }

  @RequirePermissions(USER_PERMISSIONS.USERS_READ)
  @Get(':id/export')
  exportPersonalData(@Param('id') id: string) {
    return this.usersService.exportPersonalData(id);
  }

  @RequirePermissions(USER_PERMISSIONS.USERS_WRITE)
  @Post(':id/anonymize')
  anonymize(@Param('id') id: string, @CurrentUser() caller: AuthenticatedUser) {
    return this.usersService.anonymize(id, caller.id);
  }
}
