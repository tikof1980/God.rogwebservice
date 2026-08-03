import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiMessage, AiMessageRole } from './ai-message.entity';
import { AiProviderAdapter } from './providers/provider.interface';
import { createAiProvider } from './providers/provider-factory';
import { CompaniesService } from '../companies/companies.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel, NotificationCategory } from '../notifications/notification-log.entity';

const HISTORY_WINDOW = 10; // nombre de messages précédents inclus dans le contexte

@Injectable()
export class AiService {
  private readonly adapter: AiProviderAdapter;

  constructor(
    @InjectRepository(AiMessage) private messagesRepo: Repository<AiMessage>,
    private companiesService: CompaniesService,
    private notificationsService: NotificationsService,
  ) {
    // Sélection automatique du fournisseur via la factory partagée : Gemini
    // si une clé est configurée (recommandé — palier gratuit généreux),
    // sinon un stub qui simule des réponses pour permettre de tester tout
    // le flux (webhook, historique, envoi WhatsApp).
    this.adapter = createAiProvider();
  }

  private buildSystemPrompt(companyName: string, businessType: string, personality?: string): string {
    return (
      personality ||
      `Tu es l'assistant virtuel de ${companyName} (${businessType.replace(/_/g, ' ')}). ` +
        `Réponds toujours en français, de façon professionnelle, chaleureuse et concise (2-3 phrases maximum). ` +
        `Tu peux aider à prendre un rendez-vous, donner des informations sur les services, et répondre aux questions courantes. ` +
        `Si la demande est trop complexe ou nécessite une action humaine, invite poliment le client à patienter pour qu'un membre de l'équipe le contacte.`
    );
  }

  async getHistory(companyId: string, clientPhone: string): Promise<AiMessage[]> {
    return this.messagesRepo.find({
      where: { companyId, clientPhone },
      order: { seq: 'DESC' },
      take: HISTORY_WINDOW,
    });
  }

  async listConversations(companyId: string) {
    const all = await this.messagesRepo.find({
      where: { companyId },
      order: { seq: 'DESC' },
    });
    const byPhone = new Map<string, AiMessage>();
    for (const m of all) {
      if (!byPhone.has(m.clientPhone)) byPhone.set(m.clientPhone, m);
    }
    return Array.from(byPhone.entries()).map(([clientPhone, lastMessage]) => ({
      clientPhone,
      lastMessage: lastMessage.content,
      lastMessageAt: lastMessage.createdAt,
    }));
  }

  /**
   * Traite un message entrant (WhatsApp ou widget de chat), génère la
   * réponse IA, l'enregistre dans l'historique et la renvoie. L'envoi
   * effectif au client (WhatsApp) est fait séparément par l'appelant afin
   * de garder ce service testable sans dépendre du canal de sortie.
   */
  async handleIncomingMessage(companyId: string, clientPhone: string, text: string): Promise<string> {
    const company = await this.companiesService.findOne(companyId);
    if (!company.aiEnabled) {
      throw new BadRequestException("L'assistant IA n'est pas activé pour cette entreprise.");
    }

    const recentDesc = await this.getHistory(companyId, clientPhone);
    const history = recentDesc
      .slice()
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }));

    const systemPrompt = this.buildSystemPrompt(company.name, company.businessType, company.aiPersonality);

    const reply = await this.adapter.generateReply({
      systemPrompt,
      history,
      userMessage: text,
    });

    await this.messagesRepo.save(
      this.messagesRepo.create({ companyId, clientPhone, role: AiMessageRole.USER, content: text }),
    );
    await this.messagesRepo.save(
      this.messagesRepo.create({ companyId, clientPhone, role: AiMessageRole.ASSISTANT, content: reply }),
    );

    return reply;
  }

  /** Traite le message ET envoie la réponse au client via WhatsApp (flux production). */
  async handleIncomingWhatsAppMessage(companyId: string, clientPhone: string, text: string) {
    const reply = await this.handleIncomingMessage(companyId, clientPhone, text);
    await this.notificationsService.send({
      companyId,
      channel: NotificationChannel.WHATSAPP,
      category: NotificationCategory.AI_REPLY,
      recipient: clientPhone,
      message: reply,
    });
    return reply;
  }

  get providerName(): string {
    return this.adapter.name;
  }
}
