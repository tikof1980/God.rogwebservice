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
import { Client } from '../clients/client.entity';

export enum AppointmentStatus {
  PENDING = 'pending', // en attente de confirmation client
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('appointments')
@Index(['companyId', 'startTime'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  clientId: string;

  @Column()
  serviceLabel: string; // ex: "Coupe + Barbe", "Table pour 4", "Pressing costume"

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'int', default: 30 })
  durationMinutes: number;

  @Column({ type: 'varchar', default: AppointmentStatus.PENDING })
  status: AppointmentStatus;

  @Column({ type: 'float', nullable: true })
  estimatedPrice: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Traçabilité des rappels — le déclenchement effectif (WhatsApp/SMS/push)
  // sera branché par le futur module de notifications ; ces flags évitent
  // les doublons d'envoi une fois ce module en place.
  @Column({ default: false })
  reminder24hSent: boolean;

  @Column({ default: false })
  reminder2hSent: boolean;

  @Column({ default: false })
  reminder30minSent: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
