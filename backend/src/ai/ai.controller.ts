import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { TestChatDto, UpdateAiSettingsDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/guards';
import { TenantActiveGuard } from '../common/tenant-active.guard';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { CompaniesService } from '../companies/companies.service';

@Controller('api/ai')
export class AiController {
  constructor(
    private aiService: AiService,
    private companiesService: CompaniesService,
  ) {}

  // --- Réglages IA de l'entreprise ---
  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantActiveGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  async getSettings(@CurrentUser() user: AuthenticatedUser) {
    const company = await this.companiesService.findOne(user.companyId!);
    return {
      aiEnabled: company.aiEnabled,
      aiPersonality: company.aiPersonality,
      whatsappPhoneNumberId: company.whatsappPhoneNumberId,
    };
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantActiveGuard)
  @Roles(UserRole.COMPANY_ADMIN)
  updateSettings(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateAiSettingsDto) {
    return this.companiesService.updateAiSettings(user.companyId!, dto);
  }

  @Get('info')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantActiveGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  async info() {
    return { provider: this.aiService.providerName };
  }

  // --- Historique des conversations (entreprise) ---
  @Get('conversations')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantActiveGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  conversations(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.listConversations(user.companyId!);
  }

  @Get('conversations/:phone')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantActiveGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  history(@CurrentUser() user: AuthenticatedUser, @Param('phone') phone: string) {
    return this.aiService.getHistory(user.companyId!, phone);
  }

  // --- Chat de test (widget de démo dans le dashboard entreprise) ---
  @Post('test-chat')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantActiveGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  async testChat(@CurrentUser() user: AuthenticatedUser, @Body() dto: TestChatDto) {
    const reply = await this.aiService.handleIncomingMessage(
      user.companyId!,
      dto.clientPhone || 'test-widget',
      dto.message,
    );
    return { reply };
  }

  // --- Webhook WhatsApp entrant (public — appelé par Meta en production) ---
  // En prod : la résolution de l'entreprise se fait via le phone_number_id
  // Meta présent dans le payload réel, mappé sur Company.whatsappPhoneNumberId.
  // Ici, on accepte directement companyId pour permettre la simulation/tests
  // tant que l'app WhatsApp Business n'est pas enregistrée.
  @Post('webhook/whatsapp')
  async whatsappWebhook(
    @Body() body: { companyId?: string; phoneNumberId?: string; from: string; text: string },
  ) {
    let companyId = body.companyId;
    if (!companyId && body.phoneNumberId) {
      const company = await this.companiesService.findByWhatsappPhoneNumberId(body.phoneNumberId);
      if (!company) throw new BadRequestException('Numéro WhatsApp non rattaché à une entreprise.');
      companyId = company.id;
    }
    if (!companyId) {
      throw new BadRequestException('companyId ou phoneNumberId requis.');
    }
    const reply = await this.aiService.handleIncomingWhatsAppMessage(companyId, body.from, body.text);
    return { reply };
  }
}
