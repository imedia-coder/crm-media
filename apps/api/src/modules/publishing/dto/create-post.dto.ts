import { SocialNetwork } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * API "simple" : un post = un client + un texte + des médias + des réseaux
 * cochés + « maintenant » ou « programmer ». Le service crée en interne la
 * Publication et les PublicationTarget correspondants.
 */
export class CreatePostDto {
  @IsString()
  @MinLength(1)
  companyId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(SocialNetwork, { each: true })
  networks!: SocialNetwork[];

  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsString() title?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  /** Ids de MediaAsset (uploadés) ou URLs http(s) publiques. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaIds?: string[];

  @IsIn(['now', 'schedule'])
  when!: 'now' | 'schedule';

  @IsOptional() @IsDateString() scheduledAt?: string;
}
