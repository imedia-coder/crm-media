import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum ContentTypeDto {
  POST = 'POST',
  STORY = 'STORY',
  REEL = 'REEL',
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
  NEWSLETTER = 'NEWSLETTER',
  OTHER = 'OTHER',
}

export class CreateContentDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsEnum(ContentTypeDto)
  type?: ContentTypeDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;
}
