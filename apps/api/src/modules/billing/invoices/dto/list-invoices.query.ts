import { IsOptional, IsString } from 'class-validator';

export class ListInvoicesQuery {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
