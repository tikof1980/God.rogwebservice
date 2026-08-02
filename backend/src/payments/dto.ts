import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentProvider } from './payment.entity';

export class InitiatePaymentDto {
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsNumber()
  @Min(100)
  amount: number;

  @IsInt()
  @Min(1)
  subscriptionDaysGranted: number;
}

export class ManualPaymentDto {
  @IsString()
  companyId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsInt()
  @Min(1)
  subscriptionDaysGranted: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
