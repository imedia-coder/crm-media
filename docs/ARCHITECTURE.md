# Architecture technique — Plateforme SaaS CRM pour agences media

## 1. Principes directeurs

- **Multi-tenant dès le premier jour.** Une seule plateforme sert des milliers d'agences ; l'isolation des données est un mécanisme transverse, pas une option ajoutée plus tard.
- **Modularité réelle.** Chaque module métier (CRM, Projets, Marketing, Influenceurs, Événements, Facturation, IA, Automatisation, Opérations...) est un package indépendant, activable/désactivable par tenant, avec ses propres migrations, permissions et routes API.
- **Monolithe modulaire d'abord, découplage ensuite.** On démarre en monolithe modulaire (un seul déploiement backend, modules internes bien isolés) pour aller vite en Phase 1-2, avec des frontières nettes qui permettront d'extraire des services (IA, Automatisation, Notifications) en microservices quand la charge le justifiera.
- **Un moteur d'automatisation et un moteur IA transverses**, consommés par tous les modules plutôt que réimplémentés module par module.
- **API-first.** Le frontend web, le futur portail client, la future app mobile et la marketplace consomment tous la même API publique documentée.

## 2. Stack technique proposée

| Couche | Choix | Justification |
|---|---|---|
| Langage | TypeScript partout (frontend + backend) | Un seul langage, partage de types (DTO, schémas Zod) entre client/serveur, meilleure vélocité pour une équipe réduite. |
| Frontend web | Next.js 14+ (App Router) + Tailwind CSS + shadcn/ui | SSR/SSG pour le dashboard et le portail client, écosystème mature, bon support i18n (multi-agences internationales). |
| Backend | NestJS | Architecture en modules avec DI natif — correspond 1:1 au découpage CORE/CRM/Projets/Marketing/... du cahier des charges. Facilite l'extraction future en microservices. |
| Base de données | PostgreSQL | Fiabilité transactionnelle (devis, factures, paiements), support JSONB (champs custom par module), extension `pgvector` (RAG), Row-Level Security (isolation multi-tenant). |
| ORM | Prisma (ou Drizzle si on veut du SQL plus explicite) | Migrations versionnées, typage bout en bout. |
| Cache / files d'attente | Redis + BullMQ | Sessions, rate-limiting, files pour l'automatisation, les exports, les emails/SMS, les jobs IA asynchrones. |
| Stockage fichiers | S3-compatible (AWS S3 ou Cloudflare R2) | Documents, médias, factures PDF, exports. Génération d'URLs signées pour le portail client. |
| Recherche | PostgreSQL full-text pour le MVP → Meilisearch/Typesense en Phase 2-3 | Recherche intelligente sur documents, prospects, influenceurs. |
| Temps réel | WebSockets (Socket.io ou Nest Gateway) | Notifications, présence des employés connectés, chat interne, mises à jour Kanban/Gantt en direct. |
| IA | API Claude (Anthropic) + `pgvector` pour le RAG | Génération de contenu, résumé de réunions, chat interne sur les données de l'agence, analyse marketing. |
| Paiements | Stripe (facturation SaaS ET paiements clients), + PayPal en option | Abonnements de la plateforme elle-même, paiement des factures clients, relances automatiques. |
| Signature électronique | Intégration via provider tiers (Yousign en priorité pour le marché FR, DocuSign en option) | Éviter de reconstruire un système de signature juridiquement valable. |
| Auth | JWT (access + refresh) via NestJS + Passport, MFA (TOTP) | Contrôle fin, compatible API publique et future app mobile. |
| Autorisations | RBAC + permissions fines par module (CASL) | Rôles par tenant (admin agence, commercial, chef de projet, employé, client externe). |
| Infra / déploiement | Docker + CI/CD GitHub Actions, hébergement cloud (AWS/GCP/Scaleway), orchestration via ECS ou Kubernetes selon échelle | Montée en charge progressive sans sur-ingénierie initiale. |
| Monorepo | Turborepo + pnpm workspaces | `apps/web`, `apps/api`, `apps/portal-client` (ou route Next.js dédiée), `packages/ui`, `packages/types`, `packages/config`. |

## 3. Architecture multi-tenant

**Modèle retenu : base de données partagée, schéma partagé, isolation par `tenant_id` + Row-Level Security PostgreSQL.**

Raisons :
- Coût d'infra maîtrisé pour des milliers d'agences (pas une DB par tenant).
- RLS PostgreSQL empêche structurellement une fuite de données inter-tenant, même en cas de bug applicatif (bug dans une requête Prisma ≠ fuite de données).
- Migration vers du sharding par groupe de tenants reste possible plus tard sans réécriture complète (on part déjà avec `tenant_id` partout).

Points clés :
- Table `tenants` (agences) comme racine ; toute table métier porte une colonne `tenant_id` non nullable, indexée.
- Policy RLS type : `USING (tenant_id = current_setting('app.tenant_id')::uuid)`, positionnée à chaque connexion/requête via middleware Nest.
- Un tenant "super admin" (l'éditeur de la plateforme) a une vue cross-tenant pour le support et le monitoring, via un rôle DB séparé qui bypass RLS de manière auditée.
- **Deux rôles Postgres en pratique** : un rôle "owner" (bypass RLS) réservé aux migrations et à la création d'un tenant (la ligne `RETURNING` d'un `INSERT` est elle-même filtrée par les policies `SELECT`, donc créer le tout premier enregistrement d'un tenant est structurellement impossible sous RLS classique) ; un rôle "runtime" sans `BYPASSRLS` utilisé par l'application pour toutes les requêtes scopées à un tenant. Sur les fournisseurs managés (Neon, Supabase...), le rôle par défaut a souvent `BYPASSRLS` — il faut créer explicitement le rôle applicatif restreint.
- Objets binaires (S3) préfixés par `tenant_id` dans le chemin, avec policy d'accès dédiée.
- Le module "Marketplace" et les futurs connecteurs externes stockent leurs credentials chiffrés par tenant (voir §7 Sécurité).

## 4. Découpage des modules (mapping cahier des charges → code)

```
apps/api/src/
├── core/
│   ├── auth/            (JWT, MFA, RBAC/CASL)
│   ├── tenants/         (activation/désactivation de modules par agence)
│   ├── users/
│   └── notifications/   (email, SMS, WhatsApp, push, in-app)
├── modules/
│   ├── crm/             (pipeline, prospects, clients, historisation des étapes)
│   ├── projects/        (projets, tâches, checklist, dépendances, Gantt)
│   ├── planning/        (calendrier, sync Google/Outlook/Apple, visio, salles)
│   ├── documents/       (versioning, OCR, classement, signature électronique)
│   ├── billing/         (devis, factures, avoirs, abonnements, paiements)
│   ├── accounting/      (trésorerie, TVA, marge, export comptable)
│   ├── marketing/       (calendrier éditorial, médiathèque, campagnes)
│   ├── social/          (connecteurs Meta/TikTok/LinkedIn/..., publication, stats)
│   ├── influencers/     (fiches, recherche avancée, campagnes, paiements)
│   ├── events/          (événements, billetterie, prestataires, sponsors)
│   ├── operations/      (module ajouté : briefs, BAT, versions livrables, QA)
│   ├── automation/      (moteur de règles / workflow builder, transverse)
│   ├── ai/              (assistant IA, RAG, génération de contenu, transverse)
│   ├── reporting/       (tableaux de bord, widgets, exports)
│   └── client-portal/   (surface API dédiée au portail client)
└── marketplace/         (registre de connecteurs activables, Phase 4)
```

Chaque module Nest expose : ses entités Prisma, ses permissions déclarées, ses hooks d'automatisation (événements émis/consommés), ses widgets de dashboard. Un tenant peut désactiver un module → ses routes renvoient 404 et ses widgets disparaissent du dashboard, sans supprimer les données.

## 5. Modèle de données — vue haut niveau

Entités pivots (toutes avec `tenant_id`) :

- `tenants`, `users`, `roles`, `permissions`
- `contacts` (personne physique) ↔ `companies` (personne morale), réutilisés par prospects/clients/influenceurs pour éviter la duplication
- `pipeline_stages`, `deals` (le prospect/deal traverse les étapes, chaque changement d'étape écrit une ligne dans `deal_stage_history`)
- `clients` (extension d'une `company` avec cycle de vie "client actif")
- `projects`, `tasks`, `task_dependencies`, `time_entries`
- `documents`, `document_versions`
- `quotes`, `invoices`, `credit_notes`, `payments`, `subscriptions`
- `campaigns`, `content_items`, `social_accounts`, `social_posts`
- `influencers`, `influencer_campaigns`
- `events`, `event_budgets`, `event_guests`
- `automation_rules`, `automation_runs` (transverse, référence un `trigger_type` + `entity_id` générique)
- `ai_conversations`, `ai_messages`, `embeddings` (pgvector, RAG scoping par tenant)
- `audit_logs` (append-only, transverse)

Le pipeline commercial du cahier des charges (`Prospect → Qualification → ... → Renouvellement`) est modélisé comme des `pipeline_stages` configurables par tenant plutôt que codées en dur, pour que chaque agence adapte son propre process.

## 6. Moteur d'automatisation (Workflow Builder)

- Modèle **Trigger → Conditions → Actions**, stocké en JSON (`automation_rules.definition`), édité visuellement côté frontend (React Flow ou équivalent).
- Triggers = événements métier émis par les modules via un event bus interne (EventEmitter2 de Nest en Phase 1, remplaçable par un vrai message broker — NATS/Kafka — si le volume l'exige).
- Exemple concret du cahier des charges : `quote.accepted` → actions `project.create`, `tasks.createFromTemplate`, `documents.createFolder`, `meeting.schedule`. Chaque action est un handler idempotent, exécuté via BullMQ pour ne jamais bloquer la requête HTTP d'origine et pour permettre retry/observabilité.
- Le module `ai` peut lui-même être une action d'automatisation (ex: "à la création d'un brief → générer un premier jet avec l'IA").

## 7. Module IA

- **Génération** (devis, propositions, légendes, scripts, calendriers éditoriaux, corrections) : appels directs à l'API Claude avec prompts templatés par cas d'usage, exécutés en jobs asynchrones pour les générations longues.
- **RAG interne** : ingestion des documents/notes/projets du tenant → chunking → embeddings stockés dans `pgvector`, filtrés par `tenant_id`. Le chat interne interroge uniquement les embeddings du tenant courant (isolation stricte, pas de fuite cross-agence).
- **Résumé de réunions / analyse marketing** : jobs asynchrones déclenchés manuellement ou par automatisation, résultat stocké et lié à l'entité concernée (réunion, campagne).

## 8. Sécurité

- MFA (TOTP) obligatoire pour les rôles admin.
- RBAC + permissions fines par module via CASL, vérifiées côté API (jamais uniquement côté frontend).
- Chiffrement au repos (colonnes sensibles : credentials des connecteurs, IBAN) via chiffrement applicatif (AES-256) en plus du chiffrement disque fourni par l'hébergeur.
- `audit_logs` append-only sur toutes les actions sensibles (connexion, export, changement de permission, accès au portail client par un admin).
- Sauvegardes automatiques quotidiennes + PITR PostgreSQL.
- RGPD : gestion des consentements en base, endpoints d'export/suppression des données personnelles par tenant.

## 9. API & intégrations

- API REST versionnée (`/api/v1/...`) documentée via OpenAPI/Swagger, générée depuis les DTO Nest.
- GraphQL envisageable en Phase 4 si les besoins de la marketplace/app mobile le justifient (agrégations complexes côté client) — non prioritaire en MVP.
- Connecteurs externes (réseaux sociaux, Google/Outlook, Stripe, Yousign, Canva, Slack...) isolés dans `packages/connectors`, chacun avec son propre adaptateur et ses credentials chiffrés par tenant.

## 10. Scalabilité & déploiement

- Phase 1-2 : déploiement monolithique conteneurisé (API + worker BullMQ séparés dès le début pour ne pas bloquer l'API par les jobs longs), une seule base PostgreSQL avec RLS.
- Observabilité dès le MVP : logs structurés, tracing (OpenTelemetry), métriques par tenant (utile pour le futur pricing à l'usage).
- Scaling horizontal de l'API (stateless, sessions en Redis) avant scaling de la base (read replicas, puis partitionnement par `tenant_id` si nécessaire).
- CI/CD : tests + lint + migrations Prisma automatiques en pipeline, déploiement par environnement (staging/prod).

## 11. Roadmap technique (alignée sur les phases métier)

| Phase | Contenu technique |
|---|---|
| Phase 1 (MVP) | Setup monorepo, multi-tenant + RLS, auth/MFA/RBAC, modules CRM/Projets/Tâches/Planning/Documents/Facturation, portail client basique, module Opérations en version simple (briefs + versions de livrables) |
| Phase 2 | Marketing (calendrier éditorial, médiathèque), Reporting/dashboards configurables, Notifications multi-canal |
| Phase 3 | Connecteurs réseaux sociaux, Influenceurs, moteur d'Automatisation complet, module IA (génération + RAG), signature électronique, sync Google/Outlook |
| Phase 4 | Événements, comptabilité avancée, API publique documentée pour tiers, Marketplace de connecteurs, app mobile (consommant l'API existante) |

## 12. Module "Opérations" (ajout recommandé)

Rattaché aux modules `projects` et `documents`, avec ses propres entités : `briefs`, `deliverable_versions` (v1, v2, v3...), `revision_requests` (avec compteur vs. limite contractuelle définie sur le projet/contrat), `approvals` (BAT), `quality_checks`. Chaque livrable versionné est lié à un `document` pour bénéficier du versioning/OCR déjà prévu, et chaque validation cliente passe par le portail client, journalisée dans `audit_logs`.
