import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BusinessType } from './company.entity';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
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

  @IsString()
  adminPassword: string;

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
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class RenewSubscriptionDto {
  @IsInt()
  @Min(1)
  days: number;
}
