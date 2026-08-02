import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { AppointmentStatus } from './appointment.entity';

export class CreateAppointmentDto {
  @IsUUID()
  clientId: string;

  @IsString()
  serviceLabel: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  estimatedPrice?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  serviceLabel?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  estimatedPrice?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  // Montant réellement payé, utilisé pour mettre à jour l'historique client
  // quand le statut passe à "completed"
  @IsOptional()
  @IsNumber()
  amountPaid?: number;
}
