import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AutomationAction } from '../automation-action.types';

const TRIGGERS = ['QUOTE_ACCEPTED', 'INVOICE_PAID', 'DEAL_WON'] as const;

export class CreateRuleDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsIn(TRIGGERS)
  trigger!: (typeof TRIGGERS)[number];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  actions!: AutomationAction[];
}
