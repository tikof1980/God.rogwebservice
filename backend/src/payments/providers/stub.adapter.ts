import { randomUUID } from 'crypto';
import { PaymentProviderAdapter, InitiatePaymentResult } from './provider.interface';

/**
 * Adaptateur de développement : simule le comportement d'un vrai provider
 * (Wave/Orange Money/MTN Money) sans appeler d'API externe — utile tant que
 * les vraies clés marchand ne sont pas disponibles, et pour les tests.
 *
 * Pour brancher un vrai provider en production, créer une classe qui
 * implémente PaymentProviderAdapter (ex: WaveAdapter, OrangeMoneyAdapter)
 * en suivant leur documentation officielle d'API de paiement marchand,
 * puis la sélectionner dans PaymentsService selon le provider demandé.
 */
export class StubPaymentAdapter implements PaymentProviderAdapter {
  constructor(public readonly name: string) {}

  async initiate(params: {
    reference: string;
    amount: number;
    currency: string;
    companyName: string;
  }): Promise<InitiatePaymentResult> {
    const providerTransactionId = `STUB-${this.name.toUpperCase()}-${randomUUID().slice(0, 8)}`;
    return {
      providerTransactionId,
      // En prod, cette URL serait renvoyée par l'API du provider. Ici, elle
      // pointe vers l'endpoint de confirmation manuelle utilisé en dev/démo.
      checkoutUrl: `/api/payments/dev-confirm/${params.reference}`,
    };
  }

  verifyWebhookSignature(): boolean {
    // Le stub n'a pas de secret réel à vérifier ; toujours accepté en dev.
    // Un vrai adaptateur DOIT vérifier une signature ici avant de faire
    // confiance au corps de la requête.
    return true;
  }
}
