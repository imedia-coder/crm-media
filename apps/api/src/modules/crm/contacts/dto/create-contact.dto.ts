import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateContactDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  @IsOptional()
  @IsString()
  consentSource?: string;
}
