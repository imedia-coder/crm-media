import { SocialAccountStatus } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateSocialAccountDto {
  @IsOptional() @IsString() handle?: string;
  @IsOptional() @IsString() externalId?: string;
  @IsOptional() @IsEnum(SocialAccountStatus) status?: SocialAccountStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @IsOptional() @IsDateString() tokenExpiresAt?: string;

  /** Passe à `true` pour horodater `lastSyncAt` à maintenant. */
  @IsOptional() touchSync?: boolean;
}
