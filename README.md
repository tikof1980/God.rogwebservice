# GOD.ROGWEBSERVICE — Fondation technique

Socle multi-tenant fonctionnel pour la plateforme décrite dans le master prompt.
Cette version pose l'architecture cœur ; les intégrations lourdes (WhatsApp, Wave,
Orange Money, IA vocale, apps mobiles) sont volontairement **stubées** — les points
d'entrée existent, mais il faudra y brancher vos vraies clés API en production.

## Ce qui est livré et fonctionnel

- **Backend NestJS** (`/backend`) : API REST sécurisée par JWT
  - `POST /api/auth/login`
  - `POST /api/companies` — création d'une entreprise + compte admin auto, génération de `tenantCode` et `licenseKey`
  - `GET /api/companies` — liste (recalcule le statut actif/expiré à la volée)
  - `GET /api/companies/stats` — stats globales + entreprises expirant sous 7 jours
  - `POST /api/companies/:id/suspend` / `/reactivate` / `/renew`
  - `DELETE /api/companies/:id`
  - Toutes les routes `/api/companies/*` exigent le rôle `super_admin` (guard de rôles)
  - Base SQLite en local (schéma compatible PostgreSQL — un seul changement de config pour prod)

- **Module Clients + Rendez-vous** (par entreprise, strictement isolé par tenant)
  - `POST/GET/PATCH/DELETE /api/clients` — base clients avec historique (visites, dépenses, points de fidélité)
  - `POST/GET/PATCH/DELETE /api/appointments` + `GET /api/appointments/today`
  - `PATCH /api/appointments/:id/status` — marquer confirmé/terminé/annulé/absent ; passer à "terminé" met à jour automatiquement l'historique du client
  - Toutes ces routes exigent le rôle `company_admin` ou `employee`, et sont scopées via le `companyId` du JWT (jamais via un paramètre d'URL modifiable)
  - `TenantActiveGuard` : revérifie à **chaque requête** que l'entreprise est active — une suspension prend effet immédiatement, même avec un JWT encore valide

- **Module Paiements** (architecture d'adaptateurs — Wave, Orange Money, MTN Money, carte, manuel)
  - `POST /api/payments/initiate` (entreprise) — démarre une transaction, renvoie une référence + `checkoutUrl`
  - `POST /api/payments/webhook/:provider` (public) — callback provider ; confirme le paiement et **renouvelle automatiquement l'abonnement**, de façon idempotente
  - `POST /api/payments/manual` (super admin) — enregistrement d'un paiement hors-ligne (espèces, virement)
  - `GET /api/payments/mine` (entreprise) / `GET /api/payments` + `/revenue` (super admin)
  - Chaque provider implémente l'interface `PaymentProviderAdapter` (`/backend/src/payments/providers/`) ; un `StubPaymentAdapter` simule Wave/Orange Money/MTN pour le développement, sans appel réseau externe
  - **Pour brancher un vrai provider en production** : créer une classe (ex: `WaveAdapter`) implémentant `PaymentProviderAdapter` selon la doc officielle du provider, vérifier la signature du webhook dans `verifyWebhookSignature()`, puis la sélectionner dans `PaymentsService`
  - Testé de bout en bout : paiement Wave simulé → confirmation webhook → abonnement renouvelé automatiquement, idempotence vérifiée, stats de revenus (jour/mois/total)

- **Module Notifications** (architecture d'adaptateurs par canal — WhatsApp, SMS, email, push)
  - Scheduler automatique (`@nestjs/schedule`) : rappels de rendez-vous (24h/2h/30min avant, vérifié toutes les 5 min) et rappels d'expiration d'abonnement (J-7/J-3/J-1/jour même, vérifié chaque heure), tous idempotents (un seuil n'est notifié qu'une fois par cycle)
  - `POST /api/notifications/trigger-appointment-reminders` et `/trigger-expiry-reminders` (super admin) — déclenchement manuel immédiat, utile en test comme en production
  - `GET /api/notifications/mine` (entreprise) / `GET /api/notifications` (super admin) — journal de tous les envois
  - `StubChannelAdapter` simule l'envoi (log console) sans appel réseau externe ; **pour brancher un vrai canal en production**, implémenter `NotificationChannelAdapter` (`/backend/src/notifications/providers/`) pour WhatsApp Business API / un agrégateur SMS local / SMTP, puis le sélectionner dans `NotificationsService`
  - Testé de bout en bout : rappel RDV 24h envoyé + flag marqué, rappel expiration J-7 envoyé par email et WhatsApp simultanément, idempotence vérifiée sur relance

- **Frontend Next.js** (`/frontend`)
  - `/login` → redirige selon le rôle (`super_admin` → `/dashboard`, sinon → `/workspace`)
  - `/dashboard` — Super Dashboard : stats globales, revenus, liste des entreprises, jauge de cycle d'abonnement, création/suspension/réactivation/renouvellement/suppression
  - `/workspace` — espace entreprise (company_admin/employee) : rendez-vous du jour, agenda complet, base clients avec historique fidélité, paiement/renouvellement d'abonnement, journal des notifications envoyées

## Ce qui reste à brancher (hors portée de ce socle)

- Vraies intégrations Wave/Orange Money/MTN Money (remplacer `StubPaymentAdapter` par de vraies implémentations avec les clés marchand)
- Vraies intégrations WhatsApp Business API / SMS / SMTP (remplacer `StubChannelAdapter`)
- IA par entreprise (réponse client 24/7) + IA centrale d'analyse de la plateforme
- Applications mobiles natives (Flutter) et PWA
- Déploiement Docker/Kubernetes et passage effectif à PostgreSQL/Redis

## Démarrage local

### Backend
```bash
cd backend
npm install
npm run build
npm run seed   # crée le super admin serykouame@gmail.com / ChangeMoi123!
node dist/main.js
```
API disponible sur `http://localhost:3001`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Dashboard sur `http://localhost:3000`.

**Important** : changez le mot de passe du super admin (`ChangeMoi123!`) dès la première connexion — il n'y a pas encore d'écran dédié, il faudra l'éditer directement en base ou ajouter un endpoint `change-password`.
