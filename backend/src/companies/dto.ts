import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { BusinessType } from './company.entity';

// Traite une chaîne vide comme "non fournie" — @IsOptional() de
// class-validator ne le fait pas nativement (il ne bypasse que null/
// undefined), ce qui causait des rejets "must be an email" sur un champ
// optionnel simplement laissé vide par un formulaire.
const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' ? undefined : value;

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  phone?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  subscriptionDurationDays?: number;

  // Compte admin créé automatiquement pour l'entreprise — identifié par
  // téléphone (plus adapté pour la majorité des commerces locaux qu'un
  // email, souvent absent ou peu consulté).
  @IsString()
  adminPhone: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  adminPassword?: string;

  @IsString()
  adminFullName: string;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  phone?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  email?: string;
}

export class RenewSubscriptionDto {
  @IsInt()
  @Min(1)
  days: number;
}
