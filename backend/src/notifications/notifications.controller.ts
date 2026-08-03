import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/guards';
import { TenantActiveGuard } from '../common/tenant-active.guard';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { UserRole } from '../users/user.entity';

@Controller('api/notifications')
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private scheduler: NotificationsScheduler,
  ) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantActiveGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findAllForCompany(user.companyId!);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  all() {
    return this.notificationsService.findAllGlobal();
  }

  // Déclenchement manuel (super admin) — utile pour forcer un passage
  // immédiat sans attendre le prochain cycle cron, en test comme en prod.
  @Post('trigger-appointment-reminders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async triggerAppointmentReminders() {
    await this.scheduler.handleAppointmentReminders();
    return { triggered: true };
  }

  @Post('trigger-expiry-reminders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async triggerExpiryReminders() {
    await this.scheduler.handleSubscriptionExpiryReminders();
    return { triggered: true };
  }
}
