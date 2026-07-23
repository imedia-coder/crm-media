import { IsOptional, IsString } from 'class-validator';

export class ListDealsQuery {
  @IsOptional()
  @IsString()
  stageId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;
}
