import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  // Accepte indifféremment un email ou un numéro de téléphone — la
  // résolution se fait côté AuthService.
  @IsString()
  identifier: string;

  @IsString()
  @MinLength(6)
  password: string;
}
