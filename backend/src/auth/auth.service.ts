import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(identifier: string, password: string) {
    // L'identifiant peut être un email ou un numéro de téléphone selon
    // comment le compte a été créé (super admin → email, company_admin
    // créé via le formulaire entreprise → téléphone).
    const user = await this.usersRepo.findOne({
      where: [{ email: identifier }, { phone: identifier }],
      relations: ['company'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    // Blocage si l'entreprise du user est suspendue/expirée (sauf super admin)
    if (user.company && user.company.status !== 'active') {
      throw new UnauthorizedException(
        `Espace entreprise ${user.company.status === 'suspended' ? 'suspendu' : 'expiré'}. Contactez le support.`,
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || null,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
      },
    };
  }
}
