import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Company } from './companies/company.entity';
import { User, UserRole } from './users/user.entity';

async function seed() {
  const ds = new DataSource({
    type: 'sqlite',
    database: process.env.DB_PATH || 'god_rogwebservice.sqlite',
    entities: [Company, User],
    synchronize: true,
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
