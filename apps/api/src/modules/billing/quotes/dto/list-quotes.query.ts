import { IsOptional, IsString } from 'class-validator';

export class ListQuotesQuery {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
