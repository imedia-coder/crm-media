import { SocialCapabilityKind } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * Increment 1 : la capacité est posée à la main (ou par un script). À terme
 * elle sera calculée par l'adaptateur du réseau (audit d'app, scopes, état du
 * token) — voir docs/CAHIER-DES-CHARGES-RESEAUX.md §8.
 */
export class SetCapabilityDto {
  @IsEnum(SocialCapabilityKind)
  capability!: SocialCapabilityKind;

  @IsOptional() @IsString() reason?: string;
}
