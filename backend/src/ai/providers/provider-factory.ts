import { AiProviderAdapter } from './provider.interface';
import { GeminiAdapter } from './gemini.adapter';
import { StubAiAdapter } from './stub.adapter';

/**
 * Point unique de sélection du fournisseur IA générative, partagé par
 * l'IA par entreprise (ai/) et l'IA centrale de plateforme (platform-ai/).
 * Gemini si GEMINI_API_KEY est configurée, sinon un stub de simulation.
 */
export function createAiProvider(): AiProviderAdapter {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GeminiAdapter(apiKey) : new StubAiAdapter();
}
