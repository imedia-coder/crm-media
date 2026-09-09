import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListCompaniesQuery {
  @IsOptional()
  // value vient d'une query string HTTP (toujours string | undefined a ce
  // stade) ; class-transformer type juste `value` en `any`.
  @Transform(({ value }) =>
    value === 'true'
      ? true
      : value === 'false'
        ? false
        : (value as string | undefined),
  )
  @IsBoolean()
  isClient?: boolean;
}
