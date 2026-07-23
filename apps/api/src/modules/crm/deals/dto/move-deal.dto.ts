import { IsString, MinLength } from 'class-validator';

export class MoveDealDto {
  @IsString()
  @MinLength(1)
  stageId!: string;
}
