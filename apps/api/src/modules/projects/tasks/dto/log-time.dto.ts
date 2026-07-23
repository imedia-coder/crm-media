import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class LogTimeDto {
  @IsInt()
  @Min(1)
  minutes!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
