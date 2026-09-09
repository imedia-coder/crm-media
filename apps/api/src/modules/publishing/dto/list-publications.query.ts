import { IsOptional, IsString } from 'class-validator';

export class ListPublicationsQuery {
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() campaignId?: string;
}
