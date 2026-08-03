export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Contrat que doit respecter tout fournisseur d'IA générative (Gemini,
 * Claude, un modèle local…). Le reste du système (AiService, contrôleur,
 * webhook WhatsApp) ne dépend jamais d'un fournisseur précis, ce qui permet
 * de basculer ou d'ajouter un second provider sans rien changer ailleurs.
 */
export interface AiProviderAdapter {
  readonly name: string;
  generateReply(params: {
    systemPrompt: string;
    history: AiChatMessage[];
    userMessage: string;
  }): Promise<string>;
}
