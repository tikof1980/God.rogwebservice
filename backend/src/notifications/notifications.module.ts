import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationLog } from './notification-log.entity';
import { Company } from '../companies/company.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsScheduler } from './notifications.scheduler';
import { AppointmentsModule } from '../appointments/appointments.module';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationLog, Company]), AppointmentsModule, CompaniesModule],
  providers: [NotificationsService, NotificationsScheduler],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
