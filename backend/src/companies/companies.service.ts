import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Company, CompanyStatus } from './company.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateCompanyDto, UpdateCompanyDto } from './dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private companiesRepo: Repository<Company>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  private generateTenantCode(): string {
    return `RWS-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private generateLicenseKey(): string {
    return `LIC-${randomUUID().toUpperCase()}`;
  }

  /** Recalcule le statut d'une entreprise selon la date de fin d'abonnement. */
  private computeStatus(company: Company): CompanyStatus {
    if (company.status === CompanyStatus.SUSPENDED) {
      return CompanyStatus.SUSPENDED; // suspension manuelle prioritaire
    }
    const now = new Date();
    return new Date(company.subscriptionEnd) < now
      ? CompanyStatus.EXPIRED
      : CompanyStatus.ACTIVE;
  }

  private async withComputedStatus(company: Company): Promise<Company> {
    const status = this.computeStatus(company);
    if (status !== company.status) {
      company.status = status;
      await this.companiesRepo.save(company);
    }
    return company;
  }

  async create(dto: CreateCompanyDto): Promise<Company> {
    const durationDays = dto.subscriptionDurationDays || 30;
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + durationDays);

    const company = this.companiesRepo.create({
      name: dto.name,
      businessType: dto.businessType,
      phone: dto.phone,
      email: dto.email,
      tenantCode: this.generateTenantCode(),
      licenseKey: this.generateLicenseKey(),
      subscriptionStart: now,
      subscriptionEnd: end,
      subscriptionDurationDays: durationDays,
      status: CompanyStatus.ACTIVE,
      aiEnabled: true,
      aiPersonality: `Assistant IA de ${dto.name}, professionnel, courtois, répond en français.`,
    });
    const saved = await this.companiesRepo.save(company);

    // Création automatique du compte admin de l'entreprise
    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);
    const admin = this.usersRepo.create({
      email: dto.adminEmail,
      passwordHash,
      fullName: dto.adminFullName,
      role: UserRole.COMPANY_ADMIN,
      companyId: saved.id,
      isActive: true,
    });
    await this.usersRepo.save(admin);

    return saved;
  }

  async findAll(): Promise<Company[]> {
    const companies = await this.companiesRepo.find({
      order: { createdAt: 'DESC' },
    });
    return Promise.all(companies.map((c) => this.withComputedStatus(c)));
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companiesRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Entreprise introuvable.');
    return this.withComputedStatus(company);
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOne(id);
    Object.assign(company, dto);
    return this.companiesRepo.save(company);
  }

  async suspend(id: string): Promise<Company> {
    const company = await this.findOne(id);
    company.status = CompanyStatus.SUSPENDED;
    return this.companiesRepo.save(company);
  }

  async reactivate(id: string): Promise<Company> {
    const company = await this.findOne(id);
    // Si l'abonnement était déjà expiré au moment de la réactivation,
    // on redémarre un nouveau cycle complet à partir d'aujourd'hui.
    if (new Date(company.subscriptionEnd) < new Date()) {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + company.subscriptionDurationDays);
      company.subscriptionStart = now;
      company.subscriptionEnd = end;
    }
    company.status = CompanyStatus.ACTIVE;
    return this.companiesRepo.save(company);
  }

  async renewSubscription(id: string, days: number): Promise<Company> {
    const company = await this.findOne(id);
    const base =
      new Date(company.subscriptionEnd) > new Date()
        ? new Date(company.subscriptionEnd)
        : new Date();
    base.setDate(base.getDate() + days);
    company.subscriptionEnd = base;
    company.status = CompanyStatus.ACTIVE;
    return this.companiesRepo.save(company);
  }

  async remove(id: string): Promise<void> {
    const company = await this.findOne(id);
    await this.companiesRepo.remove(company);
  }

  async daysRemaining(id: string): Promise<number> {
    const company = await this.findOne(id);
    const diffMs = new Date(company.subscriptionEnd).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  async globalStats() {
    const all = await this.findAll();
    const active = all.filter((c) => c.status === CompanyStatus.ACTIVE).length;
    const suspended = all.filter((c) => c.status === CompanyStatus.SUSPENDED).length;
    const expired = all.filter((c) => c.status === CompanyStatus.EXPIRED).length;

    // Entreprises expirant dans les 7 prochains jours (pour rappels J-7/J-3/J-1)
    const expiringSoon = all
      .filter((c) => c.status === CompanyStatus.ACTIVE)
      .map((c) => ({
        id: c.id,
        name: c.name,
        daysRemaining: Math.max(
          0,
          Math.ceil(
            (new Date(c.subscriptionEnd).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          ),
        ),
      }))
      .filter((c) => c.daysRemaining <= 7)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      totalCompanies: all.length,
      active,
      suspended,
      expired,
      expiringSoon,
    };
  }
}
