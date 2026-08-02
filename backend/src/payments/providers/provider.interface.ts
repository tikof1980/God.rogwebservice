export interface InitiatePaymentResult {
  providerTransactionId: string;
  checkoutUrl?: string; // URL de paiement à afficher au client (Wave, Orange Money)
}

/**
 * Contrat que doit respecter tout adaptateur de paiement (Wave, Orange Money,
 * MTN Money, carte…). Un seul adaptateur réel à écrire par provider ; le reste
 * du système (PaymentsService, contrôleur, webhook) n'en dépend jamais
 * directement.
 */
export interface PaymentProviderAdapter {
  readonly name: string;

  /** Démarre une transaction côté provider et retourne son identifiant. */
  initiate(params: {
    reference: string;
    amount: number;
    currency: string;
    companyName: string;
  }): Promise<InitiatePaymentResult>;

  /**
   * Vérifie la signature/authenticité d'un webhook entrant avant de faire
   * confiance à son contenu. Chaque provider a son propre mécanisme
   * (en-tête HMAC, secret partagé, etc.) — à implémenter lors du
   * branchement réel.
   */
  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean;
}
