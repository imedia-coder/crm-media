# CRM MEDIA

Plateforme SaaS de gestion pour agences media/marketing : CRM, gestion de projets, documents, facturation, marketing/contenu, planning, reporting, assistant IA et moteur d'automatisation — multi-tenant, conforme RGPD.

## Fonctionnalités

- **CRM** — prospects, entreprises, contacts, pipeline commercial (Kanban)
- **Projets & Tâches** — gestion de projets, tâches, dépendances, suivi du temps
- **Documents** — upload et versioning, stockage Cloudflare R2 (S3-compatible)
- **Facturation** — devis, factures, paiements, export PDF
- **Marketing** — calendrier éditorial, médiathèque, campagnes
- **Planning** — rendez-vous et échéances centralisés
- **Portail client** — accès dédié pour les clients (API prête, interface à venir)
- **Reporting** — chiffre d'affaires, conversion du pipeline, rentabilité des projets
- **Notifications** — alertes in-app
- **Assistant IA** — chat intégré propulsé par l'API Anthropic (Claude)
- **Automatisation** — règles « déclencheur → actions » (ex. devis accepté → création automatique du projet)
- **RGPD** — consentement, droit d'accès, droit à l'effacement, politique de rétention automatique
- **Sécurité** — authentification JWT + MFA, RBAC, isolation multi-tenant via Row-Level Security PostgreSQL

## Stack technique

- **Monorepo** : Turborepo + pnpm workspaces
- **Backend** : NestJS (TypeScript)
- **Frontend** : Next.js (App Router) + Tailwind CSS
- **Base de données** : PostgreSQL (Neon) + Prisma ORM, isolation multi-tenant par Row-Level Security
- **Stockage fichiers** : local (dev) ou S3-compatible (Cloudflare R2)
- **IA** : SDK Anthropic officiel (Claude)

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour le détail de l'architecture technique et la feuille de route.

## Démarrage rapide

### Prérequis

- Node.js ≥ 20
- pnpm
- Une base PostgreSQL (Neon recommandé)

### Installation

```bash
pnpm install
```

Copier `apps/api/.env.example` vers `apps/api/.env` et renseigner les variables (base de données, secrets JWT, stockage, clé API Anthropic si l'assistant IA est utilisé).

Appliquer les migrations :

```bash
cd apps/api
pnpm prisma migrate deploy
```

### Lancer en développement

```bash
pnpm dev
```

Démarre l'API (port 3001) et le frontend (port 3000) en parallèle via Turborepo.

Sur Windows, un double-clic sur `demarrer-crm.bat` (à la racine) lance automatiquement les deux serveurs et ouvre le navigateur.

Créez ensuite votre compte sur [http://localhost:3000/register](http://localhost:3000/register).

## Structure du projet

```
apps/
  api/       API NestJS (modules métier, Prisma, auth, RGPD, automatisation, IA)
  web/       Frontend Next.js
packages/
  types/     Types partagés
  config/    Configuration partagée
docs/
  ARCHITECTURE.md   Documentation technique complète
```
