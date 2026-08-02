import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Company } from './companies/company.entity';
import { User } from './users/user.entity';
import { Client } from './clients/client.entity';
import { Appointment } from './appointments/appointment.entity';
import { Payment } from './payments/payment.entity';
import { CompaniesModule } from './companies/companies.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DB_PATH || 'god_rogwebservice.sqlite',
      entities: [Company, User, Client, Appointment, Payment],
      synchronize: true, // OK en dev ; utiliser des migrations en production (Postgres)
    }),
    AuthModule,
    CompaniesModule,
    ClientsModule,
    AppointmentsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
