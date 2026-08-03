import { Injectable } from '@nestjs/common';
import { AiProviderAdapter } from '../ai/providers/provider.interface';
import { createAiProvider } from '../ai/providers/provider-factory';
import { CompaniesService } from '../companies/companies.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompanyStatus } from '../companies/company.entity';

export type AnomalySeverity = 'info' | 'warning' | 'critical';

export interface Anomaly {
  type: string;
  severity: AnomalySeverity;
  message: string;
  companyId?: string;
  companyName?: string;
}

@Injectable()
export class PlatformAiService {
  private readonly adapter: AiProviderAdapter;

  constructor(
    private companiesService: CompaniesService,
    private paymentsService: PaymentsService,
    private notificationsService: NotificationsService,
  ) {
    this.adapter = createAiProvider();
  }

  get providerName(): string {
    return this.adapter.name;
  }

  /**
   * Détection d'anomalies purement déterministe (règles), volontairement
   * indépendante de l'IA générative : ces alertes doivent rester fiables
   * et explicables même si le fournisseur IA est indisponible.
   */
  async detectAnomalies(): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // 1. Entreprises actives dont l'abonnement est en réalité déjà expiré
    // (ne devrait normalement jamais arriver grâce au recalcul automatique,
    // mais sert de garde-fou en cas de bug ou d'horloge décalée).
    const companies = await this.companiesService.findAll();
    for (const c of companies) {
      if (c.status === CompanyStatus.ACTIVE && new Date(c.subscriptionEnd) < new Date()) {
        anomalies.push({
          type: 'subscription_inconsistency',
          severity: 'critical',
          message: `${c.name} est marquée active alors que son abonnement a expiré le ${new Date(c.subscriptionEnd).toLocaleDateString('fr-FR')}.`,
          companyId: c.id,
          companyName: c.name,
        });
      }
    }

    // 2. Paiements bloqués en attente depuis plus de 24h (provider probablement en échec)
    const stuckPayments = await this.paymentsService.findStuckPending(24);
    for (const p of stuckPayments) {
      const company = companies.find((c) => c.id === p.companyId);
      anomalies.push({
        type: 'payment_stuck',
        severity: 'warning',
        message: `Paiement ${p.reference} (${p.provider}) en attente depuis plus de 24h pour ${company?.name || p.companyId}.`,
        companyId: p.companyId,
        companyName: company?.name,
      });
    }

    // 3. Échecs de notification récents (numéro/email invalide, canal cassé)
    const failedNotifications = await this.notificationsService.recentFailures(24);
    const byCompany = new Map<string, number>();
    for (const f of failedNotifications) {
      if (!f.companyId) continue;
      byCompany.set(f.companyId, (byCompany.get(f.companyId) || 0) + 1);
    }
    for (const [companyId, count] of byCompany.entries()) {
      const company = companies.find((c) => c.id === companyId);
      anomalies.push({
        type: 'notification_failures',
        severity: count >= 3 ? 'warning' : 'info',
        message: `${count} échec(s) d'envoi de notification pour ${company?.name || companyId} au cours des dernières 24h.`,
        companyId,
        companyName: company?.name,
      });
    }

    // 4. Entreprises suspendues depuis longtemps (risque de désabonnement définitif)
    const suspended = companies.filter((c) => c.status === CompanyStatus.SUSPENDED);
    for (const c of suspended) {
      anomalies.push({
        type: 'long_suspended',
        severity: 'info',
        message: `${c.name} est suspendue — vérifier si une relance commerciale est nécessaire.`,
        companyId: c.id,
        companyName: c.name,
      });
    }

    return anomalies;
  }

  /**
   * Rapport narratif en français généré par l'IA à partir des données
   * agrégées de la plateforme (stats, revenus, anomalies). L'IA ne fait
   * que mettre en forme et interpréter ; les chiffres sous-jacents viennent
   * intégralement de règles déterministes ci-dessus et des services métier.
   */
  async generateReport(): Promise<{ report: string; anomalies: Anomaly[]; stats: any; revenue: any }> {
    const [stats, revenue, anomalies] = await Promise.all([
      this.companiesService.globalStats(),
      this.paymentsService.revenueStats(),
      this.detectAnomalies(),
    ]);

    const systemPrompt =
      `Tu es l'assistant IA d'analyse pour Rogweb Service, l'opérateur de la plateforme SaaS GOD.ROGWEBSERVICE. ` +
      `On te donne des données brutes sur l'état de la plateforme. Rédige un rapport court (5-8 phrases), en français, ` +
      `professionnel et actionnable pour un dirigeant pressé : résume la situation générale, signale les points ` +
      `d'attention prioritaires (dans l'ordre de gravité), et propose une ou deux actions concrètes à mener. ` +
      `Ne répète pas mécaniquement tous les chiffres, mets en évidence ce qui compte.`;

    const dataDescription = JSON.stringify({ stats, revenue, anomalies }, null, 2);

    const report = await this.adapter.generateReply({
      systemPrompt,
      history: [],
      userMessage: `Voici les données actuelles de la plateforme :\n${dataDescription}`,
    });

    return { report, anomalies, stats, revenue };
  }
}
