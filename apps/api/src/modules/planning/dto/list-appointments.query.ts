import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ListAppointmentsQuery {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}
