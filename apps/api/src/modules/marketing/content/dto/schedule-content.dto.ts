import { IsDateString } from 'class-validator';

export class ScheduleContentDto {
  @IsDateString()
  scheduledAt!: string;
}
