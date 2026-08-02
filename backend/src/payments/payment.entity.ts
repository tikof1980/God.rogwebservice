import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../companies/company.entity';

export enum PaymentProvider {
  WAVE = 'wave',
  ORANGE_MONEY = 'orange_money',
  MTN_MONEY = 'mtn_money',
  CARD = 'card',
  MANUAL = 'manual', // enregistré à la main par le super admin (espèces, virement…)
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentPurpose {
  SUBSCRIPTION_RENEWAL = 'subscription_renewal',
  SUBSCRIPTION_NEW = 'subscription_new',
}

@Entity('payments')
@Index(['companyId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: string;

  @Column({ type: 'varchar' })
  provider: PaymentProvider;

  @Column({ type: 'varchar', default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'varchar', default: PaymentPurpose.SUBSCRIPTION_RENEWAL })
  purpose: PaymentPurpose;

  @Column({ type: 'float' })
  amount: number;

  @Column({ default: 'XOF' })
  currency: string;

  @Column({ unique: true })
  reference: string; // référence interne, envoyée au provider

  // Identifiant renvoyé par le provider une fois la transaction initiée
  // (ex: checkout_id Wave, transaction id Orange Money) — utile pour
  // réconcilier les webhooks de confirmation.
  @Column({ nullable: true })
  providerTransactionId: string;

  @Column({ type: 'int' })
  subscriptionDaysGranted: number;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  confirmedAt: Date;
}
