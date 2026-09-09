import {
  SocialAccountStatus,
  SocialCapabilityKind,
  SocialNetwork,
} from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * Increment 1 : on enregistre le compte et ses métadonnées. Le flux OAuth
 * (récupération et stockage chiffré des tokens) arrive à l'increment suivant,
 * donc aucun token en clair n'est accepté ici.
 */
export class CreateSocialAccountDto {
  @IsString()
  @MinLength(1)
  companyId!: string;

  @IsEnum(SocialNetwork)
  network!: SocialNetwork;

  @IsOptional() @IsString() handle?: string;
  @IsOptional() @IsString() externalId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @IsOptional() @IsDateString() tokenExpiresAt?: string;
  @IsOptional() @IsEnum(SocialAccountStatus) status?: SocialAccountStatus;
  @IsOptional() @IsEnum(SocialCapabilityKind) capability?: SocialCapabilityKind;
}
