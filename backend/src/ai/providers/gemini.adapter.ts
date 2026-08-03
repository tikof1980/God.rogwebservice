import { AiProviderAdapter, AiChatMessage } from './provider.interface';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Fournisseur par défaut recommandé : Google Gemini (gemini-1.5-flash) —
 * palier gratuit généreux, adapté à un usage commercial de service client,
 * contrairement à l'API Claude qui n'a pas de palier gratuit en production.
 *
 * Nécessite la variable d'environnement GEMINI_API_KEY (clé obtenue
 * gratuitement sur https://aistudio.google.com/apikey).
 */
export class GeminiAdapter implements AiProviderAdapter {
  readonly name = 'gemini';

  constructor(private apiKey: string) {}

  async generateReply(params: {
    systemPrompt: string;
    history: AiChatMessage[];
    userMessage: string;
  }): Promise<string> {
    const contents = [
      ...params.history.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: params.userMessage }] },
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: params.systemPrompt }] },
        generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erreur Gemini (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Réponse Gemini vide ou inattendue.');
    }
    return text.trim();
  }
}
