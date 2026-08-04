import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Company } from './companies/company.entity';
import { User, UserRole } from './users/user.entity';
import { getDatabaseConfig } from './config/database.config';

async function seed() {
  // Utilise la même config bascule SQLite/Postgres que l'application elle-
  // même (getDatabaseConfig), pour ne jamais créer le super admin dans la
  // mauvaise base par erreur.
  const ds = new DataSource({
    ...(getDatabaseConfig() as any),
    entities: [Company, User],
  });
  await ds.initialize();

  const usersRepo = ds.getRepository(User);
  const existing = await usersRepo.findOne({
    where: { email: 'serykouame@gmail.com' },
  });

  if (existing) {
    console.log('Le super admin existe déjà.');
    await ds.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash('ChangeMoi123!', 10);
  const superAdmin = usersRepo.create({
    email: 'serykouame@gmail.com',
    passwordHash,
    fullName: 'Roger Kouamé',
    role: UserRole.SUPER_ADMIN,
    isActive: true,
  });
  await usersRepo.save(superAdmin);

  console.log('Super admin créé :');
  console.log('  email    : serykouame@gmail.com');
  console.log('  password : ChangeMoi123!  (à changer immédiatement)');

  await ds.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
