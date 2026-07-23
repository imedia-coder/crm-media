import { IsOptional, IsString } from 'class-validator';

export class ListContactsQuery {
  @IsOptional()
  @IsString()
  companyId?: string;
}
