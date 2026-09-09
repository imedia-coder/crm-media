import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { SOCIAL_PERMISSIONS } from '../../core/auth/permissions.constants';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { ListSocialAccountsQuery } from './dto/list-social-accounts.query';
import { SetCapabilityDto } from './dto/set-capability.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { SocialService } from './social.service';

@Controller('social/accounts')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @RequirePermissions(SOCIAL_PERMISSIONS.ACCOUNTS_READ)
  @Get()
  findAll(@Query() query: ListSocialAccountsQuery) {
    return this.socialService.findAll(query);
  }

  @RequirePermissions(SOCIAL_PERMISSIONS.ACCOUNTS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.socialService.findOneOrThrow(id);
  }

  @RequirePermissions(SOCIAL_PERMISSIONS.ACCOUNTS_CONNECT)
  @Post()
  create(@Body() dto: CreateSocialAccountDto) {
    return this.socialService.create(dto);
  }

  @RequirePermissions(SOCIAL_PERMISSIONS.ACCOUNTS_CONNECT)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSocialAccountDto) {
    return this.socialService.update(id, dto);
  }

  @RequirePermissions(SOCIAL_PERMISSIONS.ACCOUNTS_CONNECT)
  @Put(':id/capability')
  setCapability(@Param('id') id: string, @Body() dto: SetCapabilityDto) {
    return this.socialService.setCapability(id, dto);
  }

  @RequirePermissions(SOCIAL_PERMISSIONS.ACCOUNTS_DISCONNECT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.socialService.remove(id);
  }
}
