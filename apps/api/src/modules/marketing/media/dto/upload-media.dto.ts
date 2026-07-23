import { IsOptional, IsString } from 'class-validator';

export class UploadMediaDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  tags?: string; // comma-separated, multipart form fields can't carry arrays

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  contentItemId?: string;
}
