import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  // Limite spécifique et plus stricte que le taux global de l'app : le
  // login est la cible privilégiée des attaques par force brute.
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.identifier, dto.password);
  }
}
