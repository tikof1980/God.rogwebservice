import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/user.entity';

const SUPER_ADMIN_EMAIL = 'serykouame@gmail.com';

/**
 * Crée automatiquement le compte super admin au démarrage de l'application
 * s'il n'existe pas encore — utile pour les environnements (Render, etc.)
 * où l'on ne peut pas lancer manuellement `npm run seed` après le premier
 * déploiement. Idempotent : ne fait rien si le compte existe déjà, donc
 * s'exécute sans risque à chaque redémarrage.
 *
 * Le mot de passe initial se règle via la variable d'environnement
 * SUPER_ADMIN_PASSWORD ; à défaut, une valeur de secours est utilisée —
 * à changer immédiatement après la première connexion.
 */
@Injectable()
export class SeedSuperAdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedSuperAdminService.name);

  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async onApplicationBootstrap() {
    const existing = await this.usersRepo.findOne({ where: { email: SUPER_ADMIN_EMAIL } });
    if (existing) return;

    const password = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    const superAdmin = this.usersRepo.create({
      email: SUPER_ADMIN_EMAIL,
      passwordHash,
      fullName: 'Roger Kouamé',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });
    await this.usersRepo.save(superAdmin);

    this.logger.log(
      `Super admin créé automatiquement : ${SUPER_ADMIN_EMAIL} — changez le mot de passe dès la première connexion.`,
    );
  }
}
