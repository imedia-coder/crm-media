import { IsEnum, IsOptional } from 'class-validator';
import { PaymentMethodDto } from './record-payment.dto';

export class MarkPaidDto {
  @IsOptional()
  @IsEnum(PaymentMethodDto)
  method?: PaymentMethodDto;
}
