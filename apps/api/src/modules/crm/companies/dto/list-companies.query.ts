import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListCompaniesQuery {
  @IsOptional()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  @IsBoolean()
  isClient?: boolean;
}
