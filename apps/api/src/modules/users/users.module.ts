import { Module } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TenancyModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
