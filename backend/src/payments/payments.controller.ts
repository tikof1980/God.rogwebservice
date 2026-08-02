import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto, ManualPaymentDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/guards';
import { TenantActiveGuard } from '../common/tenant-active.guard';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { UserRole } from '../users/user.entity';

@Controller('api/payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // --- Côté entreprise : initier un paiement pour renouveler son abonnement ---
  @Post('initiate')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantActiveGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  initiate(@CurrentUser() user: AuthenticatedUser, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiate(user.companyId!, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantActiveGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.findAllForCompany(user.companyId!);
  }

  // --- Côté super admin : vue globale + paiement manuel ---
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  all() {
    return this.paymentsService.findAllGlobal();
  }

  @Get('revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  revenue() {
    return this.paymentsService.revenueStats();
  }

  @Post('manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  manual(@Body() dto: ManualPaymentDto) {
    return this.paymentsService.recordManual(
      dto.companyId,
      dto.amount,
      dto.subscriptionDaysGranted,
      dto.notes,
    );
  }

  // --- Callbacks provider (aucune auth JWT : appelés par Wave/Orange Money/MTN) ---
  // En production : vérifier adapter.verifyWebhookSignature(rawBody, headers)
  // AVANT de faire confiance au contenu. Le payload exact (nom des champs,
  // en-tête de signature) dépend de la doc de chaque provider.
  @Post('webhook/:provider')
  webhook(@Param('provider') provider: string, @Body() body: { reference: string; success: boolean; reason?: string }) {
    if (body.success) {
      return this.paymentsService.confirm(body.reference);
    }
    return this.paymentsService.markFailed(body.reference, body.reason || 'Échec provider');
  }

  // --- Simulation locale (dev/démo uniquement) tant qu'aucun vrai provider
  // n'est branché : confirme un paiement "pending" comme le ferait un webhook réel.
  @Post('dev-confirm/:reference')
  devConfirm(@Param('reference') reference: string) {
    return this.paymentsService.confirm(reference);
  }
}
