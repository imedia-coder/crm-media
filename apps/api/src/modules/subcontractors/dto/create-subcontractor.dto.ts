import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateSubcontractorDto {
  // Identité de la personne
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsOptional() @IsString() personalAddress?: string;
  @IsOptional() @IsString() personalPostalCode?: string;
  @IsOptional() @IsString() personalCity?: string;
  @IsOptional() @IsString() personalPhone?: string;
  @IsOptional() @IsEmail() personalEmail?: string;
  @IsOptional() @IsString() idDocumentNumber?: string;
  @IsOptional() @IsDateString() idDocumentValidUntil?: string;

  // Entreprise
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() legalForm?: string;
  @IsOptional() @IsString() siret?: string;
  @IsOptional() @IsString() vatNumber?: string;
  @IsOptional() @IsString() companyAddress?: string;
  @IsOptional() @IsString() companyPostalCode?: string;
  @IsOptional() @IsString() companyCity?: string;
  @IsOptional() @IsString() companyPhone?: string;
  @IsOptional() @IsEmail() companyEmail?: string;

  // Coordonnées bancaires
  @IsOptional() @IsString() bankAccountHolder?: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() iban?: string;
  @IsOptional() @IsString() bic?: string;

  // Assurances
  @IsOptional() @IsString() insuranceCompany?: string;
  @IsOptional() @IsString() insurancePolicyNumber?: string;
  @IsOptional() @IsDateString() insuranceValidUntil?: string;
  @IsOptional() @IsBoolean() hasLiabilityInsurance?: boolean;
  @IsOptional() @IsBoolean() hasTenYearInsurance?: boolean;

  // Prestation
  @IsOptional() @IsString() serviceType?: string;
  @IsOptional() @IsNumber() dailyRate?: number;
  @IsOptional() @IsString() interventionZone?: string;
  @IsOptional() @IsDateString() availableFrom?: string;
  @IsOptional() @IsString() experienceNotes?: string;

  // Signature
  @IsOptional() @IsDateString() signedAt?: string;
  @IsOptional() @IsString() signedLocation?: string;
}
