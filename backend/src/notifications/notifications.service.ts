import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationLog,
  NotificationChannel,
  NotificationStatus,
  NotificationCategory,
} from './notification-log.entity';
import { NotificationChannelAdapter } from './providers/channel.interface';
import { StubChannelAdapter } from './providers/stub-channel.adapter';

@Injectable()
export class NotificationsService {
  private adapters: Record<NotificationChannel, NotificationChannelAdapter> = {
    [NotificationChannel.WHATSAPP]: new StubChannelAdapter('whatsapp'),
    [NotificationChannel.SMS]: new StubChannelAdapter('sms'),
    [NotificationChannel.EMAIL]: new StubChannelAdapter('email'),
    [NotificationChannel.PUSH]: new StubChannelAdapter('push'),
  };

  constructor(
    @InjectRepository(NotificationLog) private logsRepo: Repository<NotificationLog>,
  ) {}

  async send(params: {
    companyId: string | null;
    channel: NotificationChannel;
    category: NotificationCategory;
    recipient: string;
    message: string;
  }) {
    const adapter = this.adapters[params.channel];
    const result = await adapter.send(params.recipient, params.message);

    const log = this.logsRepo.create({
      companyId: params.companyId,
      channel: params.channel,
      category: params.category,
      recipient: params.recipient,
      message: params.message,
      status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
      failureReason: result.failureReason,
    });
    return this.logsRepo.save(log);
  }

  findAllForCompany(companyId: string) {
    return this.logsRepo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  findAllGlobal() {
    return this.logsRepo.find({ order: { createdAt: 'DESC' }, take: 200 });
  }
}
