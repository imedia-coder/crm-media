import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { PLANNING_PERMISSIONS } from '../../core/auth/permissions.constants';
import type { AuthenticatedUser } from '../../core/auth/types/jwt-payload.interface';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsQuery } from './dto/list-appointments.query';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('planning/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @RequirePermissions(PLANNING_PERMISSIONS.APPOINTMENTS_READ)
  @Get()
  findAll(@Query() query: ListAppointmentsQuery) {
    return this.appointmentsService.findAll(query);
  }

  @RequirePermissions(PLANNING_PERMISSIONS.APPOINTMENTS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOneOrThrow(id);
  }

  @RequirePermissions(PLANNING_PERMISSIONS.APPOINTMENTS_WRITE)
  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.create(dto, user.id);
  }

  @RequirePermissions(PLANNING_PERMISSIONS.APPOINTMENTS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @RequirePermissions(PLANNING_PERMISSIONS.APPOINTMENTS_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
