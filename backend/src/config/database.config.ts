import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.entity';
import { Client } from '../clients/client.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Payment } from '../payments/payment.entity';
import { NotificationLog } from '../notifications/notification-log.entity';
import { AiMessage } from '../ai/ai-message.entity';

const entities = [Company, User, Client, Appointment, Payment, NotificationLog, AiMessage];

/**
 * SQLite par défaut (aucune config requise, pratique en développement local
 * et pour ce socle de démonstration). Pour la production, définir
 * DB_TYPE=postgres avec les variables DB_HOST/DB_PORT/DB_NAME/DB_USER/
 * DB_PASSWORD (voir docker-compose.yml et backend/.env.example).
 *
 * `synchronize: true` reste acceptable tant que le schéma évolue vite en
 * développement ; à remplacer par de vraies migrations TypeORM avant toute
 * mise en production sérieuse pour éviter toute perte de données.
 */
export function getDatabaseConfig(): TypeOrmModuleOptions {
  if (process.env.DB_TYPE === 'postgres') {
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities,
      synchronize: true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    type: 'sqlite',
    database: process.env.DB_PATH || 'god_rogwebservice.sqlite',
    entities,
    synchronize: true,
  };
}
