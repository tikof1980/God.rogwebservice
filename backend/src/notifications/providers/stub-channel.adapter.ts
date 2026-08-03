import { NotificationChannelAdapter, SendResult } from './channel.interface';

/**
 * Adaptateur de développement : n'appelle aucune API externe (WhatsApp
 * Business API, agrégateur SMS local, SMTP…) et journalise simplement le
 * message dans la console. Toujours "réussi" pour ne pas bloquer les tests.
 *
 * Pour brancher un vrai canal en production, créer une classe implémentant
 * NotificationChannelAdapter (ex: WhatsAppBusinessAdapter, SmtpEmailAdapter)
 * et la sélectionner dans NotificationsService.
 */
export class StubChannelAdapter implements NotificationChannelAdapter {
  constructor(public readonly name: string) {}

  async send(to: string, message: string): Promise<SendResult> {
    // eslint-disable-next-line no-console
    console.log(`[STUB ${this.name.toUpperCase()}] → ${to} : ${message}`);
    return { success: true };
  }
}
