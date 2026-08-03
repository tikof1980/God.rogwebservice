import { IsOptional, IsString } from 'class-validator';

export class UpdateAiSettingsDto {
  @IsOptional()
  aiEnabled?: boolean;

  @IsOptional()
  @IsString()
  aiPersonality?: string;

  @IsOptional()
  @IsString()
  whatsappPhoneNumberId?: string;
}

export class TestChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;
}
