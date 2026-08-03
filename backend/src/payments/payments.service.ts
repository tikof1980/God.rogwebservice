import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Payment, PaymentProvider, PaymentStatus, PaymentPurpose } from './payment.entity';
import { PaymentProviderAdapter } from './providers/provider.interface';
import { StubPaymentAdapter } from './providers/stub.adapter';
import { CompaniesService } from '../companies/companies.service';
import { InitiatePaymentDto } from './dto';

@Injectable()
export class PaymentsService {
  // Registre des adaptateurs par provider. En production, remplacer les
  // StubPaymentAdapter par de vraies implémentations (WaveAdapter, etc.)
  // sans toucher au reste de ce service.
  private adapters: Record<PaymentProvider, PaymentProviderAdapter> = {
    [PaymentProvider.WAVE]: new StubPaymentAdapter('wave'),
    [PaymentProvider.ORANGE_MONEY]: new StubPaymentAdapter('orange_money'),
    [PaymentProvider.MTN_MONEY]: new StubPaymentAdapter('mtn_money'),
    [PaymentProvider.CARD]: new StubPaymentAdapter('card'),
    [PaymentProvider.MANUAL]: new StubPaymentAdapter('manual'),
  };

  constructor(
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    private companiesService: CompaniesService,
  ) {}

  async initiate(companyId: string, dto: InitiatePaymentDto) {
    const company = await this.companiesService.findOne(companyId);
    const reference = `PAY-${randomUUID().slice(0, 10).toUpperCase()}`;

    const adapter = this.adapters[dto.provider];
    const result = await adapter.initiate({
      reference,
      amount: dto.amount,
      currency: 'XOF',
      companyName: company.name,
    });

    const payment = this.paymentsRepo.create({
      companyId,
      provider: dto.provider,
      status: PaymentStatus.PENDING,
      purpose: PaymentPurpose.SUBSCRIPTION_RENEWAL,
      amount: dto.amount,
      currency: 'XOF',
      reference,
      providerTransactionId: result.providerTransactionId,
      subscriptionDaysGranted: dto.subscriptionDaysGranted,
    });
    await this.paymentsRepo.save(payment);

    return { payment, checkoutUrl: result.checkoutUrl };
  }

  /** Enregistrement direct d'un paiement hors-ligne (espèces, virement) par le super admin. */
  async recordManual(companyId: string, amount: number, days: number, notes?: string) {
    await this.companiesService.findOne(companyId); // 404 si inconnue
    const reference = `MANUAL-${randomUUID().slice(0, 10).toUpperCase()}`;
    const payment = this.paymentsRepo.create({
      companyId,
      provider: PaymentProvider.MANUAL,
      status: PaymentStatus.SUCCESS,
      purpose: PaymentPurpose.SUBSCRIPTION_RENEWAL,
      amount,
      currency: 'XOF',
      reference,
      subscriptionDaysGranted: days,
      confirmedAt: new Date(),
      failureReason: notes,
    });
    await this.paymentsRepo.save(payment);
    await this.companiesService.renewSubscription(companyId, days);
    return payment;
  }

  /**
   * Confirme un paiement suite à un webhook provider (ou, en dev, un appel
   * manuel via /dev-confirm). Applique le renouvellement d'abonnement
   * de façon idempotente : un paiement déjà confirmé ne renouvelle pas deux fois.
   */
  async confirm(reference: string) {
    const payment = await this.paymentsRepo.findOne({ where: { reference } });
    if (!payment) throw new NotFoundException('Paiement introuvable.');

    if (payment.status === PaymentStatus.SUCCESS) {
      return payment; // idempotent — déjà traité
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Paiement déjà clôturé avec le statut "${payment.status}".`,
      );
    }

    payment.status = PaymentStatus.SUCCESS;
    payment.confirmedAt = new Date();
    await this.paymentsRepo.save(payment);

    await this.companiesService.renewSubscription(
      payment.companyId,
      payment.subscriptionDaysGranted,
    );

    return payment;
  }

  async markFailed(reference: string, reason: string) {
    const payment = await this.paymentsRepo.findOne({ where: { reference } });
    if (!payment) throw new NotFoundException('Paiement introuvable.');
    if (payment.status !== PaymentStatus.PENDING) return payment;
    payment.status = PaymentStatus.FAILED;
    payment.failureReason = reason;
    return this.paymentsRepo.save(payment);
  }

  findAllForCompany(companyId: string) {
    return this.paymentsRepo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }

  findAllGlobal() {
    return this.paymentsRepo.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  /** Paiements en attente depuis plus de `hours` heures — signale un blocage provider probable. */
  async findStuckPending(hours = 24) {
    const threshold = new Date(Date.now() - hours * 3600000);
    const pending = await this.paymentsRepo.find({ where: { status: PaymentStatus.PENDING } });
    return pending.filter((p) => new Date(p.createdAt) < threshold);
  }

  async revenueStats() {
    const successful = await this.paymentsRepo.find({
      where: { status: PaymentStatus.SUCCESS },
    });
    const total = successful.reduce((sum, p) => sum + p.amount, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const monthly = successful
      .filter((p) => new Date(p.confirmedAt) >= startOfMonth)
      .reduce((sum, p) => sum + p.amount, 0);
    const daily = successful
      .filter((p) => new Date(p.confirmedAt) >= startOfDay)
      .reduce((sum, p) => sum + p.amount, 0);

    return { totalRevenue: total, monthlyRevenue: monthly, dailyRevenue: daily, currency: 'XOF' };
  }

  getAdapter(provider: PaymentProvider) {
    return this.adapters[provider];
  }
}
