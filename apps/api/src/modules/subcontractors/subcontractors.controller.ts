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
} from '@nestjs/common';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { SUBCONTRACTOR_PERMISSIONS } from '../../core/auth/permissions.constants';
import type { AuthenticatedUser } from '../../core/auth/types/jwt-payload.interface';
import { CreateSubcontractorDto } from './dto/create-subcontractor.dto';
import { UpdateSubcontractorDto } from './dto/update-subcontractor.dto';
import { SubcontractorsService } from './subcontractors.service';

@Controller('subcontractors')
export class SubcontractorsController {
  constructor(private readonly subcontractorsService: SubcontractorsService) {}

  @RequirePermissions(SUBCONTRACTOR_PERMISSIONS.SUBCONTRACTORS_READ)
  @Get()
  findAll() {
    return this.subcontractorsService.findAll();
  }

  @RequirePermissions(SUBCONTRACTOR_PERMISSIONS.SUBCONTRACTORS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subcontractorsService.findOneOrThrow(id);
  }

  @RequirePermissions(SUBCONTRACTOR_PERMISSIONS.SUBCONTRACTORS_WRITE)
  @Post()
  create(
    @Body() dto: CreateSubcontractorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subcontractorsService.create(dto, user);
  }

  @RequirePermissions(SUBCONTRACTOR_PERMISSIONS.SUBCONTRACTORS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubcontractorDto) {
    return this.subcontractorsService.update(id, dto);
  }

  @RequirePermissions(SUBCONTRACTOR_PERMISSIONS.SUBCONTRACTORS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subcontractorsService.remove(id);
  }
}
