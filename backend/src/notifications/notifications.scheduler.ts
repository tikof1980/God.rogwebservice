import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationChannel, NotificationCategory } from './notification-log.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { CompaniesService } from '../companies/companies.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private notificationsService: NotificationsService,
    private appointmentsService: AppointmentsService,
    private companiesService: CompaniesService,
  ) {}

  /** Rappels de rendez-vous (24h / 2h / 30min avant) — vérifié toutes les 5 minutes. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAppointmentReminders() {
    const pending = await this.appointmentsService.findAllPendingRemindersAcrossCompanies();
    for (const { appointment, which } of pending) {
      const client = appointment.client;
      if (!client?.phone) continue;

      const label =
        which === '24h' ? 'demain' : which === '2h' ? 'dans 2 heures' : 'dans 30 minutes';
      const message = `Rappel : vous avez rendez-vous ${label} pour "${appointment.serviceLabel}".`;

      await this.notificationsService.send({
        companyId: appointment.companyId,
        channel: NotificationChannel.WHATSAPP,
        category: NotificationCategory.APPOINTMENT_REMINDER,
        recipient: client.phone,
        message,
      });
      await this.appointmentsService.markReminderSent(appointment.id, which);
      this.logger.log(`Rappel RDV ${which} envoyé à ${client.phone} (${appointment.id})`);
    }
  }

  /** Rappels d'expiration d'abonnement (J-7, J-3, J-1, jour même) — vérifié chaque heure. */
  @Cron(CronExpression.EVERY_HOUR)
  async handleSubscriptionExpiryReminders() {
    const due = await this.companiesService.findCompaniesNeedingExpiryReminder();
    for (const { company, threshold } of due) {
      const message =
        threshold > 0
          ? `Votre abonnement GOD.ROGWEBSERVICE expire dans ${threshold} jour(s). Renouvelez pour éviter toute interruption.`
          : `Votre abonnement GOD.ROGWEBSERVICE expire aujourd'hui. Renouvelez dès maintenant pour éviter la suspension de votre espace.`;

      if (company.email) {
        await this.notificationsService.send({
          companyId: company.id,
          channel: NotificationChannel.EMAIL,
          category: NotificationCategory.SUBSCRIPTION_EXPIRY,
          recipient: company.email,
          message,
        });
      }
      if (company.phone) {
        await this.notificationsService.send({
          companyId: company.id,
          channel: NotificationChannel.WHATSAPP,
          category: NotificationCategory.SUBSCRIPTION_EXPIRY,
          recipient: company.phone,
          message,
        });
      }
      await this.companiesService.markExpiryReminderSent(company.id, threshold);
      this.logger.log(`Rappel expiration J-${threshold} envoyé à ${company.name}`);
    }
  }
}
