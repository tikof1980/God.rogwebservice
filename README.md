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

- **Frontend Next.js** (`/frontend`)
  - `/login` → redirige selon le rôle (`super_admin` → `/dashboard`, sinon → `/workspace`)
  - `/dashboard` — Super Dashboard : stats globales, liste des entreprises, jauge de cycle d'abonnement, création/suspension/réactivation/renouvellement/suppression
  - `/workspace` — espace entreprise (company_admin/employee) : rendez-vous du jour, agenda complet, base clients avec historique fidélité

## Ce qui reste à brancher (hors portée de ce socle)

- Paiements réels : Wave, Orange Money, MTN Money, cartes, QR code
- Notifications : WhatsApp Business API, SMS, emails automatiques, rappels J-7/J-3/J-1 (les entités le prévoient déjà — `reminder24hSent`/`reminder2hSent`/`reminder30minSent` sur `Appointment`, `findPendingReminders()` dans `AppointmentsService` — il manque le scheduler + les providers d'envoi)
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
