import { IsOptional, IsString } from 'class-validator';

export class UpdatePublicationDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() contentItemId?: string | null;
  @IsOptional() @IsString() campaignId?: string | null;
}
