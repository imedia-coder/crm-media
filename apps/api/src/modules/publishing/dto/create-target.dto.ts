import { PublicationTargetMode, SocialNetwork } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTargetDto {
  @IsString()
  @MinLength(1)
  accountId!: string;

  /** Optionnel : par défaut le réseau du compte. Doit correspondre s'il est fourni. */
  @IsOptional() @IsEnum(SocialNetwork) network?: SocialNetwork;

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
