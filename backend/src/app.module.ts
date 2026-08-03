import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Company } from './companies/company.entity';
import { User } from './users/user.entity';
import { Client } from './clients/client.entity';
import { Appointment } from './appointments/appointment.entity';
import { Payment } from './payments/payment.entity';
import { NotificationLog } from './notifications/notification-log.entity';
import { AiMessage } from './ai/ai-message.entity';
import { CompaniesModule } from './companies/companies.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DB_PATH || 'god_rogwebservice.sqlite',
      entities: [Company, User, Client, Appointment, Payment, NotificationLog, AiMessage],
      synchronize: true, // OK en dev ; utiliser des migrations en production (Postgres)
    }),
    AuthModule,
    CompaniesModule,
    ClientsModule,
    AppointmentsModule,
    PaymentsModule,
    NotificationsModule,
    AiModule,
  ],
})
export class AppModule {}
