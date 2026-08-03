import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiMessage } from './ai-message.entity';
import { Company } from '../companies/company.entity';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { CompaniesModule } from '../companies/companies.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([AiMessage, Company]), CompaniesModule, NotificationsModule],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
