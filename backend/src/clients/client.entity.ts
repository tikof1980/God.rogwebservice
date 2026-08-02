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

@Entity('clients')
@Index(['companyId'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  preferences: string;

  @Column({ default: 0 })
  visitsCount: number;

  @Column({ type: 'float', default: 0 })
  totalSpent: number;

  @Column({ default: 0 })
  loyaltyPoints: number;

  @CreateDateColumn()
  createdAt: Date;
}
