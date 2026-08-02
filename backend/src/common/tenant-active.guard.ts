import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, CompanyStatus } from '../companies/company.entity';

/**
 * Contrairement au login (qui vérifie le statut une seule fois), ce guard
 * revérifie à CHAQUE requête que l'entreprise est toujours active — pour
 * qu'une suspension prenne effet immédiatement même si le JWT en cours
 * n'a pas expiré. S'applique uniquement aux rôles company_admin/employee ;
 * un super_admin n'est jamais rattaché à une entreprise et passe toujours.
 */
@Injectable()
export class TenantActiveGuard implements CanActivate {
  constructor(
    @InjectRepository(Company) private companiesRepo: Repository<Company>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    if (!user || user.role === 'super_admin') return true;

    const company = await this.companiesRepo.findOne({
      where: { id: user.companyId },
    });
    if (!company) {
      throw new ForbiddenException('Entreprise introuvable.');
    }

    const now = new Date();
    const effectiveStatus =
      company.status === CompanyStatus.SUSPENDED
        ? CompanyStatus.SUSPENDED
        : new Date(company.subscriptionEnd) < now
        ? CompanyStatus.EXPIRED
        : CompanyStatus.ACTIVE;

    if (effectiveStatus !== CompanyStatus.ACTIVE) {
      throw new ForbiddenException(
        effectiveStatus === CompanyStatus.SUSPENDED
          ? 'Espace entreprise suspendu. Contactez le support Rogweb Service.'
          : 'Abonnement expiré. Renouvelez votre licence pour continuer.',
      );
    }
    return true;
  }
}
