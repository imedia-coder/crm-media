import { SocialNetwork } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class GenerateHashtagsDto {
  /** Sujet ou légende du contenu. */
  @IsString()
  @MinLength(2)
  topic!: string;

  @IsOptional()
  @IsEnum(SocialNetwork)
  network?: SocialNetwork;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(30)
  count?: number;
}
