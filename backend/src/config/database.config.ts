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
 * et pour ce socle de démonstration, avec `synchronize: true`). Pour la
 * production, définir DB_TYPE=postgres avec les variables DB_HOST/DB_PORT/
 * DB_NAME/DB_USER/DB_PASSWORD (voir docker-compose.yml et
 * backend/.env.example) — le schéma est alors géré par de vraies migrations
 * versionnées (src/migrations/, appliquées automatiquement au démarrage en
 * production via migrationsRun, ou manuellement via `npm run migration:run`).
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
      // synchronize désactivé dès que Postgres est utilisé : le schéma est
      // désormais géré par des migrations versionnées (voir src/migrations/
      // et les scripts npm migration:*), pour éviter toute perte de données
      // accidentelle sur un changement de schéma en production.
      synchronize: false,
      migrations: ['dist/migrations/*.js'],
      migrationsRun: process.env.NODE_ENV === 'production', // auto-applique les migrations au démarrage en prod
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    type: 'sqlite',
    database: process.env.DB_PATH || 'god_rogwebservice.sqlite',
    entities,
    // synchronize reste pratique en développement local avec SQLite (socle
    // de démonstration à évolution rapide) ; jamais utilisé avec Postgres.
    synchronize: true,
  };
}
