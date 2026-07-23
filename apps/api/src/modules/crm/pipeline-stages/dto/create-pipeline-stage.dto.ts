import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePipelineStageDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsInt()
  order!: number;

  @IsOptional()
  @IsBoolean()
  isWon?: boolean;

  @IsOptional()
  @IsBoolean()
  isLost?: boolean;
}
