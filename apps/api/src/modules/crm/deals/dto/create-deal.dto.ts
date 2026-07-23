import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateDealDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  stageId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  winProbability?: number;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  sourceSocialNetwork?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;
}
