import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../core/tenancy/tenant-prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsQuery } from './dto/list-appointments.query';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  findAll(query: ListAppointmentsQuery) {
    return this.tenantPrisma.client.appointment.findMany({
      where: {
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.from || query.to
          ? {
              startAt: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
      },
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        organizer: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async findOneOrThrow(id: string) {
    const appointment = await this.tenantPrisma.client.appointment.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        organizer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  create(dto: CreateAppointmentDto, organizerId: string) {
    return this.tenantPrisma.client.appointment.create({
      data: {
        tenantId: this.tenantPrisma.tenantId,
        title: dto.title,
        description: dto.description,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        location: dto.location,
        projectId: dto.projectId,
        companyId: dto.companyId,
        organizerId,
      },
    });
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    await this.findOneOrThrow(id);
    return this.tenantPrisma.client.appointment.update({
      where: { id },
      data: {
        ...dto,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.tenantPrisma.client.appointment.delete({ where: { id } });
  }
}
