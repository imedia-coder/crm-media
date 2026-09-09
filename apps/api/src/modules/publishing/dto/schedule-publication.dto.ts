import { IsDateString } from 'class-validator';

export class SchedulePublicationDto {
  @IsDateString()
  scheduledAt!: string;
}
