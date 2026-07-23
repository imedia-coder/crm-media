import { IsOptional, IsString } from 'class-validator';

export class ListProjectsQuery {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
