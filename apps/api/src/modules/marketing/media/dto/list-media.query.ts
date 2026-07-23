import { IsOptional, IsString } from 'class-validator';

export class ListMediaQuery {
  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  contentItemId?: string;

  @IsOptional()
  @IsString()
  tag?: string;
}
