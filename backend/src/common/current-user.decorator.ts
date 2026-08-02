import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: 'super_admin' | 'company_admin' | 'employee';
  companyId: string | null;
}

/**
 * Injecte l'utilisateur JWT courant dans un handler de contrôleur.
 * Utilisé partout où une ressource doit être scopée à req.user.companyId
 * plutôt qu'à un paramètre d'URL (évite qu'un company_admin accède
 * aux données d'une autre entreprise en changeant l'id dans l'URL).
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
