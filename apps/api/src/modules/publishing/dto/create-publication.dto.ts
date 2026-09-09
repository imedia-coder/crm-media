import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePublicationDto {
  @IsString()
  @MinLength(1)
  companyId!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional() @IsString() contentItemId?: string;
  @IsOptional() @IsString() campaignId?: string;
}
