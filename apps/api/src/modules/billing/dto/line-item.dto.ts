import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class LineItemDto {
  @IsString()
  @MinLength(1)
  description!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vatRate?: number;
}
