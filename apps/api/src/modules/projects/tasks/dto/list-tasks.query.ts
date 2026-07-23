import { IsOptional, IsString } from 'class-validator';

export class ListTasksQuery {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
