import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAiService } from './platform-ai.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/guards';
import { UserRole } from '../users/user.entity';

@Controller('api/platform-ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class PlatformAiController {
  constructor(private platformAiService: PlatformAiService) {}

  @Get('anomalies')
  anomalies() {
    return this.platformAiService.detectAnomalies();
  }

  @Get('report')
  report() {
    return this.platformAiService.generateReport();
  }
}
