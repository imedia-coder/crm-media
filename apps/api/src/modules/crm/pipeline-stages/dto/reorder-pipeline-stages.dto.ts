import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsString, ValidateNested } from 'class-validator';

class StageOrderEntry {
  @IsString()
  id!: string;

  @IsInt()
  order!: number;
}

export class ReorderPipelineStagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StageOrderEntry)
  stages!: StageOrderEntry[];
}
