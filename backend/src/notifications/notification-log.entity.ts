import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum NotificationChannel {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  EMAIL = 'email',
  PUSH = 'push',
}

export enum NotificationStatus {
  SENT = 'sent',
  FAILED = 'failed',
}

export enum NotificationCategory {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  SUBSCRIPTION_EXPIRY = 'subscription_expiry',
  SUBSCRIPTION_BLOCKED = 'subscription_blocked',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  OTHER = 'other',
}

@Entity('notification_logs')
@Index(['companyId'])
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ type: 'varchar' })
  channel: NotificationChannel;

  @Column({ type: 'varchar' })
  category: NotificationCategory;

  @Column({ type: 'varchar', default: NotificationStatus.SENT })
  status: NotificationStatus;

  @Column()
  recipient: string; // numéro ou email du destinataire

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;
}
