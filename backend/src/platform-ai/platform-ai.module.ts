import { Module } from '@nestjs/common';
import { PlatformAiService } from './platform-ai.service';
import { PlatformAiController } from './platform-ai.controller';
import { CompaniesModule } from '../companies/companies.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CompaniesModule, PaymentsModule, NotificationsModule],
  providers: [PlatformAiService],
  controllers: [PlatformAiController],
})
export class PlatformAiModule {}
