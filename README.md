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

- **Module IA par entreprise** (Google Gemini par défaut — palier gratuit généreux, contrairement à l'API Claude qui n'en a pas en production)
  - Sélection automatique du fournisseur : `GeminiAdapter` (réel, appelle l'API Gemini) si `GEMINI_API_KEY` est définie, sinon `StubAiAdapter` (simulation, pour développer/tester sans clé ni accès réseau)
  - Historique de conversation par client (`AiMessage`, tri par séquence auto-incrémentée pour un ordre chronologique fiable même sur des échanges rapprochés), utilisé comme contexte à chaque nouvelle génération
  - `PATCH /api/ai/settings` (company_admin) — activer/désactiver l'IA, personnaliser ses instructions, associer un `whatsappPhoneNumberId`
  - `POST /api/ai/test-chat` (entreprise) — chat de test intégré au dashboard, sans dépendre de WhatsApp
  - `POST /api/ai/webhook/whatsapp` (public) — point d'entrée des messages entrants ; en production, résout l'entreprise via `whatsappPhoneNumberId` (mappé sur le `phone_number_id` Meta), génère la réponse, puis l'envoie via le canal WhatsApp déjà construit dans le module Notifications
  - **Pour l'activer réellement** : créer une clé gratuite sur https://aistudio.google.com/apikey, la définir en variable d'environnement `GEMINI_API_KEY` ; pour WhatsApp, enregistrer une app WhatsApp Business (Meta for Developers), renseigner `whatsappPhoneNumberId` par entreprise et brancher le vrai webhook Meta (vérification de signature à ajouter)
  - Testé de bout en bout avec le stub : historique multi-tours, activation/désactivation, webhook entrant → réponse générée → notification WhatsApp journalisée

- **Module IA centrale de plateforme** (pour Rogweb Service — analyse globale, distinct de l'IA par entreprise)
  - `GET /api/platform-ai/anomalies` (super admin) — détection déterministe (règles, pas d'IA) : incohérences d'abonnement, paiements bloqués >24h, échecs de notification répétés, entreprises suspendues de longue date. Volontairement indépendante de l'IA générative pour rester fiable même si Gemini est indisponible
  - `GET /api/platform-ai/report` (super admin) — rapport narratif en français généré par Gemini à partir des stats/revenus/anomalies agrégés ; l'IA met en forme et priorise, les chiffres viennent intégralement des services métier
  - Réutilise la même factory de fournisseur IA que le module IA par entreprise (`createAiProvider()` dans `/backend/src/ai/providers/provider-factory.ts`) — aucune duplication de la logique Gemini/stub
  - Testé : anomalie `long_suspended` détectée correctement, paiement en attente non signalé avant 24h (comportement attendu), rapport narratif généré à partir des données réelles

- **Frontend Next.js** (`/frontend`)
  - `/login` → redirige selon le rôle (`super_admin` → `/dashboard`, sinon → `/workspace`)
  - `/dashboard` — Super Dashboard : stats globales, revenus, **panneau d'anomalies + génération de rapport IA**, liste des entreprises, jauge de cycle d'abonnement, création/suspension/réactivation/renouvellement/suppression
  - `/workspace` — espace entreprise (company_admin/employee) : rendez-vous du jour, agenda complet, base clients avec historique fidélité, paiement/renouvellement d'abonnement, journal des notifications, réglages + chat de test de l'assistant IA

- **PWA (Progressive Web App)**
  - Manifest (`/frontend/public/manifest.json`) + icônes générées (192/512/maskable) — installable sur Android, iOS et desktop directement depuis le navigateur ("Ajouter à l'écran d'accueil")
  - Service worker généré automatiquement au build (`next-pwa`) : les appels `/api/*` restent toujours en réseau direct (jamais de cache sur les données métier), le reste des ressources statiques est mis en cache pour un chargement plus rapide et une tolérance aux coupures réseau ponctuelles
  - Le service worker est désactivé en développement (`next dev`) et actif uniquement en production (`next build && next start`)

- **Migrations TypeORM** (PostgreSQL) — `synchronize` n'est plus jamais utilisé avec PostgreSQL, remplacé par de vraies migrations versionnées
  - `backend/src/migrations/` contient la migration initiale, générée et **testée contre une vraie instance PostgreSQL** (installée temporairement dans cet environnement pour l'occasion), pas seulement écrite à l'aveugle
  - Ce test a révélé un vrai bug de portabilité : les colonnes de dates étaient typées `datetime` (spécifique SQLite), incompatible avec PostgreSQL qui attend `timestamp` — ni l'un ni l'autre n'étant en fait universel, la colonne est maintenant laissée sans type explicite pour que TypeORM déduise automatiquement le bon type natif par moteur. `backend/src/seed.ts` avait aussi le type de base de données câblé en dur sur SQLite ; il utilise maintenant la même config bascule que l'application
  - `migrationsRun: true` en production : les migrations s'appliquent automatiquement au démarrage (`NODE_ENV=production` + `DB_TYPE=postgres`) — testé sur une base PostgreSQL vierge, tables/contraintes/clés étrangères créées correctement, puis cycle fonctionnel complet (login, création d'entreprise) validé contre cette base réelle
  - Commandes disponibles : `npm run migration:generate -- src/migrations/NomDeLaMigration`, `npm run migration:run`, `npm run migration:revert` (voir `backend/src/config/data-source.ts`)

- **Déploiement Docker / Kubernetes**
  - `backend/Dockerfile` et `frontend/Dockerfile` : builds multi-étapes, images de production allégées, utilisateur non-root
  - Le backend bascule automatiquement SQLite (dev, par défaut) / PostgreSQL (prod, via `DB_TYPE=postgres` + `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`) — voir `backend/src/config/database.config.ts`
  - `docker-compose.yml` (racine) : lance backend + frontend + PostgreSQL en un `docker compose up -d --build` (copier `.env.example` en `.env` d'abord)
  - `k8s/` : manifests Kubernetes complets pour un vrai cluster — namespace, PostgreSQL en StatefulSet avec volume persistant, backend/frontend en Deployment avec autoscaling horizontal (HPA, 2→10 replicas selon le CPU), Ingress HTTPS (nginx + cert-manager)
  - **Pour déployer sur un cluster réel** : construire et pousser les images sur un registre (`docker build -t <registre>/god-rogwebservice-backend ./backend`), copier `k8s/01-secrets.example.yaml` en `01-secrets.local.yaml` avec de vraies valeurs, ajuster les noms de domaine dans `40-ingress.yaml`, puis `kubectl apply -f k8s/`
  - Note : ce sandbox n'a pas Docker installé, donc les Dockerfiles et manifests n'ont pas pu être testés par un vrai build/déploiement ici — seule leur syntaxe (YAML) et la cohérence de la config (bascule SQLite/PostgreSQL testée en local) ont été vérifiées

- **Application mobile** (`/mobile`) — wrapper Flutter natif autour de la PWA, plutôt qu'une réécriture complète (voir `mobile/README.md` pour la justification et les étapes de mise en place)
  - Choix assumé : dupliquer toute l'interface en Flutter aurait créé deux bases de code à maintenir indéfiniment pour un gain limité, alors que la PWA est déjà installable
  - `mobile/lib/main.dart` fourni et complet (WebView, gestion d'erreur hors-ligne, bouton retour Android, ouverture native des liens tel/mailto/WhatsApp) — **non testé ici** car Flutter n'est pas installé dans ce sandbox ; `mobile/README.md` détaille précisément les commandes à lancer chez vous (`flutter create`, remplacement des fichiers fournis, build)

- **Durcissement sécurité / production**
  - `helmet` : en-têtes de sécurité HTTP (HSTS, X-Content-Type-Options, X-Frame-Options…) sur toutes les réponses
  - Rate limiting (`@nestjs/throttler`) : 60 req/min/IP par défaut sur toute l'API, limite renforcée à 8 req/min sur `/api/auth/login` (cible privilégiée du brute-force) et 30 req/min sur les webhooks publics (paiements, WhatsApp)
  - CORS restreint aux domaines listés dans `ALLOWED_ORIGINS` en production (ouvert par défaut en développement)
  - **Garde-fou de démarrage** : en production (`NODE_ENV=production`), le serveur refuse de démarrer (code de sortie 1, message explicite) si `JWT_SECRET` est absent ou égal à une valeur par défaut connue, ou si `DB_PASSWORD` est manquant avec PostgreSQL — empêche un déploiement silencieusement non sécurisé
  - Testé : 429 après 8 tentatives de login en une minute, refus de démarrage confirmé sans secret, démarrage normal confirmé avec un vrai secret

## Ce qui reste à brancher (hors portée de ce socle)

- Vraies intégrations Wave/Orange Money/MTN Money (remplacer `StubPaymentAdapter` par de vraies implémentations avec les clés marchand)
- Vraies intégrations WhatsApp Business API / SMS / SMTP (remplacer `StubChannelAdapter`) et vérification de signature du webhook Meta
- Clé `GEMINI_API_KEY` en production (le code est prêt, il ne manque que la clé — active à la fois l'IA par entreprise et les rapports de plateforme)
- Scaffold Flutter réel (`flutter create` + build) — voir `mobile/README.md`
- Test réel des images Docker et du déploiement Kubernetes sur un cluster (non testable dans cet environnement de développement)
- Notifications push natives (Firebase Cloud Messaging) dans l'app mobile

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
