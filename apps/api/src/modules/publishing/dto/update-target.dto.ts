import { PublicationTargetMode } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateTargetDto {
  @IsOptional() @IsString() caption?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaIds?: string[];

  @IsOptional() @IsEnum(PublicationTargetMode) mode?: PublicationTargetMode;
}
