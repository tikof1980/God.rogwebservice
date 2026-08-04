import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.entity';
import { Client } from '../clients/client.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Payment } from '../payments/payment.entity';
import { NotificationLog } from '../notifications/notification-log.entity';
import { AiMessage } from '../ai/ai-message.entity';

/**
 * DataSource utilisé UNIQUEMENT par le CLI TypeORM (génération/exécution de
 * migrations — voir les scripts npm `migration:*`). L'application NestJS
 * elle-même se connecte via getDatabaseConfig() (config/database.config.ts),
 * qui reste la source de vérité pour le runtime.
 *
 * Les migrations sont générées et testées contre PostgreSQL — la cible de
 * production réelle — plutôt que contre SQLite, pour éviter les écarts de
 * types de colonnes entre les deux moteurs.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'devpass',
  database: process.env.DB_NAME || 'god_rogwebservice',
  entities: [Company, User, Client, Appointment, Payment, NotificationLog, AiMessage],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
