import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum CompanyStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
}

export enum BusinessType {
  SALON_COIFFURE = 'salon_coiffure',
  BARBER_SHOP = 'barber_shop',
  INSTITUT_BEAUTE = 'institut_beaute',
  RESTAURANT = 'restaurant',
  HOTEL = 'hotel',
  PRESSING = 'pressing',
  BOUTIQUE = 'boutique',
  PHARMACIE = 'pharmacie',
  CLINIQUE = 'clinique',
  GARAGE = 'garage',
  ECOLE = 'ecole',
  SALLE_DE_SPORT = 'salle_de_sport',
  CABINET_MEDICAL = 'cabinet_medical',
  CABINET_JURIDIQUE = 'cabinet_juridique',
  AGENCE_IMMOBILIERE = 'agence_immobiliere',
  SUPERMARCHE = 'supermarche',
  AUTRE = 'autre',
}

/**
 * Chaque entreprise représente un "tenant" isolé logiquement.
 * Toutes les données métier (clients, rendez-vous, etc.) sont
 * rattachées à un companyId, garantissant l'étanchéité des espaces.
 */
@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tenantCode: string; // identifiant unique public (ex: RWS-8F2C1A)

  @Column()
  name: string;

  @Column({ type: 'varchar', default: BusinessType.AUTRE })
  businessType: BusinessType;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'varchar', default: CompanyStatus.ACTIVE })
  status: CompanyStatus;

  @Column({ unique: true })
  licenseKey: string;

  @Column({ type: 'datetime' })
  subscriptionStart: Date;

  @Column({ type: 'datetime' })
  subscriptionEnd: Date;

  @Column({ default: 30 })
  subscriptionDurationDays: number;

  @Column({ default: false })
  aiEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  aiPersonality: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => User, (user) => user.company)
  users: User[];
}
