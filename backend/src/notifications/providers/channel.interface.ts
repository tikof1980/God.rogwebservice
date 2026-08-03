export interface SendResult {
  success: boolean;
  failureReason?: string;
}

/**
 * Contrat que doit respecter tout adaptateur d'envoi (WhatsApp Business API,
 * SMS via un agrégateur local, email via SMTP…). Le reste du système
 * (NotificationsService, scheduler) ne dépend jamais d'un provider précis.
 */
export interface NotificationChannelAdapter {
  readonly name: string;
  send(to: string, message: string): Promise<SendResult>;
}
