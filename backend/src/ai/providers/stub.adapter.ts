import { AiProviderAdapter, AiChatMessage } from './provider.interface';

/**
 * Utilisé automatiquement quand aucune clé GEMINI_API_KEY n'est configurée.
 * Génère une réponse simple mais cohérente, basée sur le prompt système,
 * pour permettre de tester tout le flux (webhook, historique, envoi
 * WhatsApp) sans dépendre d'un accès réseau externe ni d'une clé API.
 */
export class StubAiAdapter implements AiProviderAdapter {
  readonly name = 'stub';

  async generateReply(params: {
    systemPrompt: string;
    history: AiChatMessage[];
    userMessage: string;
  }): Promise<string> {
    return (
      `Merci pour votre message : "${params.userMessage}". ` +
      `Un membre de notre équipe vous répondra rapidement. ` +
      `(Réponse simulée — aucune clé GEMINI_API_KEY configurée.)`
    );
  }
}
