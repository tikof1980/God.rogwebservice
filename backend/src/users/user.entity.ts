import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../companies/company.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin', // administre GOD.ROGWEBSERVICE
  COMPANY_ADMIN = 'company_admin', // administre une entreprise
  EMPLOYEE = 'employee',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // L'un des deux (email OU phone) doit être renseigné pour permettre la
  // connexion — le super admin utilise généralement un email, un
  // company_admin créé par téléphone (ex: pressing, salon) utilise phone.
  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({ type: 'varchar', default: UserRole.EMPLOYEE })
  role: UserRole;

  // null pour un super_admin (pas rattaché à une entreprise)
  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ nullable: true })
  companyId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
