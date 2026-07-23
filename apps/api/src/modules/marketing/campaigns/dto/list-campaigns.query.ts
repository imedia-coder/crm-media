import { IsOptional, IsString } from 'class-validator';

export class ListCampaignsQuery {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
