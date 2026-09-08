# Cahier des charges — Module Réseaux Sociaux (Agency Hub)

> Version 0.1 — cadrage interne. À confronter aux limites réelles des API Meta / TikTok avant chiffrage.
> Version rendue (mise en page, diagrammes) : artifact `Agency Hub Réseaux`
> (https://claude.ai/code/artifact/1ca8daa2-7f35-4ce2-8f63-1a6d3067d3be).
> Voir aussi [`ARCHITECTURE.md`](./ARCHITECTURE.md).
>
> **Le Studio Vidéo IA est le cœur du produit** (transformer une vidéo longue en plusieurs
> shorts prêts à publier, façon Clipzi / Opus Clip, intégré à la gestion des clients).
> Spec dédiée : [`STUDIO-VIDEO-IA.md`](./STUDIO-VIDEO-IA.md) — pipeline, DAG de jobs, modèle de
> données détaillé, build vs buy, phasage Studio-first. Ce document couvre le reste du module.

## Objectif

Un seul logiciel pilote **plusieurs clients → plusieurs réseaux → plusieurs contenus →
production assistée par IA → programmation → publication → statistiques → facturation**,
pour 20 à 100+ clients sans que l'organisation devienne ingérable.

Chaîne de valeur, linéaire, à laquelle se rattache chaque écran / entité / permission :

```
CLIENTS → CONTENUS → STUDIO IA → CALENDRIER → VALIDATION → PUBLICATION → ANALYTICS → RAPPORT CLIENT
```

Le cycle se referme : les analytics nourrissent le Studio IA (formats, durées, horaires,
hooks qui performent chez *ce* client).

Principe absolu : **une étape qui échoue passe en « action requise » ; elle ne bloque jamais
la chaîne entière.** Chaque cible de publication (un réseau) est indépendante.

---

## 1. Ce qui existe déjà dans Agency Hub

Socle : CRM d'agence multi-tenant (NestJS + Prisma, PostgreSQL + Row-Level Security,
front Next.js). Le module Réseaux le **prolonge**.

| Brique existante | Rôle actuel | Réutilisation |
|---|---|---|
| `Tenant / User / Role / Permission` | Multi-tenant, RBAC `domaine.ressource.action` | Socle inchangé ; ajout de permissions `social.*`, `publishing.*`, `studio.*` |
| `Company` | Entreprise / client | = le « client » : porte le Brand Kit, les réseaux, l'abonnement |
| `Campaign` | Campagne (objectif, dates, budget) | Regroupe contenus & médias d'une opération |
| `ContentItem` + enum `ContentStatus` | `DRAFT · PENDING_VALIDATION · VALIDATED · REJECTED · SCHEDULED · PUBLISHED` | Le pipeline de publication **est déjà modélisé** ; on ajoute les cibles multi-réseaux |
| `MediaAsset` | Fichier média, `tags[]`, lien campagne/contenu | Base de la médiathèque ; ajout `kind`, `lifecycle`, dossier, personne, dimensions |
| `AutomationRule` (trigger → actions JSON) | Règles « devis accepté → créer projet » | Nouveaux triggers `CONTENT_VALIDATED`, `VIDEO_RENDERED`, `PUBLICATION_FAILED` |
| `AiConversation / AiMessage` (API Claude) | Assistant IA interne | Moteur légendes / hashtags / hooks / insights |
| `Notification`, `Quote / Invoice / Payment` | Notifs in-app, devis-factures | Notifs de la chaîne ; facturation des packs réseaux |
| `Subcontractor` | Fiche prestataire (identité, IBAN, assurances, TJM) | Affectation à une mission ; marge agence par projet |
| `WhatsApp` (Whapi) | Canal de conversation client | Notification « X contenus à valider » |
| RLS Postgres, rétention RGPD, MFA TOTP | Isolation `tenant_id`, anonymisation | S'étend aux tokens OAuth sociaux (chiffrés) et aux médias vidéo |

### À construire

- **Couche d'intégration réseaux** : un adaptateur par réseau, OAuth, statut de capacité par
  compte, rafraîchissement des tokens.
- **Moteur de publication** : planificateur, file d'attente, tentatives/retries, fallback
  « brouillon » ou « action manuelle » par réseau.
- **Studio Vidéo IA** *(cœur du produit)* : upload → transcription → analyse → détection de
  clips scorés + hooks → montage auto (silences, recadrage, sous-titres) → contrôle de format →
  export, en jobs asynchrones. Approche **hybride** : acheter la commodité (ASR, diarisation,
  détection de plans, recadrage active-speaker, rendu sous-titres), construire ce qui est le
  produit (sélection des clips, score, variantes A/B, aperçu/validation, rattachement
  publication). Détail : [`STUDIO-VIDEO-IA.md`](./STUDIO-VIDEO-IA.md).
- **Calendrier éditorial** drag & drop, « une publication → plusieurs réseaux » (variantes).
- **Validation client** avec fil de commentaires horodaté.
- **Brand Kit** + fiche de contexte IA (public, ton, langues, objectif).
- **Analytics** : ingestion des métriques + insights IA + rapport mensuel PDF.
- **Abonnements & quotas** (14 / 20 publications) et **finance interne** (marge par projet).
- **Vues transverses** : Mode Agence / Mode Client, « Aujourd'hui », « Inbox ».

---

## 2. Principes directeurs

1. **Multi-tenant strict** — garanti par la RLS, pas seulement par le code applicatif.
2. **Monolithe modulaire + workers** — API NestJS unique ; traitements lourds (vidéo,
   publication, analytics, rapports) dans des workers séparés dès le départ.
3. **Capability-driven** — chaque compte social expose un statut de capacité ; l'UI s'adapte,
   ne code jamais « TikTok = brouillon » en dur.
4. **Jamais bloquant** — un échec devient une carte « Action requise » (cause + bouton).
5. **Humain dans la boucle** — l'IA propose, un opérateur valide toujours avant programmation.
6. **API-first** — web, portail client, futur mobile consomment `/api/v1` (OpenAPI).

---

## 3. Architecture technique

Conserver le monolithe modulaire NestJS et la base PostgreSQL unique + RLS. Ajouter :
une **file d'attente** (Redis + BullMQ), un **parc de workers**, un **service de traitement vidéo**.

Le Studio étant le cœur, le **pipeline vidéo** est la principale contrainte de scaling (avant le
moteur de publication) : workers GPU distincts (ASR + CV) et CPU (ffmpeg), stockage objets
étagé, upload résumable (tus), quotas **minutes-source** par tenant. Voir [`STUDIO-VIDEO-IA.md`](./STUDIO-VIDEO-IA.md) §3 (DAG de jobs) et §5 (infra).

| Couche | Choix | Note |
|---|---|---|
| Front web | Next.js 16 · React 19 · Tailwind 4 · SWR | En place. Ajout : calendrier drag & drop, éditeur de sous-titres, lecteur timeline |
| API | NestJS · Prisma · REST `/api/v1` | Nouveaux modules `social`, `publishing`, `studio`, `validation`, `analytics`, `plans` |
| Base | PostgreSQL + RLS | `tenant_id` partout ; `USING (tenant_id = current_setting('app.tenant_id')::uuid)` |
| File / cache | **Redis + BullMQ** *(nouveau)* | Publication programmée, retries, transcodage, transcription, analytics, PDF |
| Workers | Process Node séparés *(nouveau)* | `worker-publish`, `worker-video-gpu` (ASR + CV), `worker-video-cpu` (ffmpeg), `worker-analytics`, `worker-reports` |
| Stockage objets | S3-compatible (R2 / Scaleway), **étagé** | Bruts (froid après 30 j), proxys (chaud), rendus (chaud → froid), miniatures, PDF. Chemins `tenant_id/client_id/project_id/…`, URLs signées |
| Traitement vidéo | **ffmpeg + Whisper (ASR au mot) + pyannote + PySceneDetect + MediaPipe/LightASD + libass** *(nouveau)* | Proxy, découpe, retrait silences/tics, recadrage active-speaker 9:16/4:5/1:1, incrustation sous-titres mot-à-mot, loudnorm. Détail & build vs buy : [`STUDIO-VIDEO-IA.md`](./STUDIO-VIDEO-IA.md) §2 |
| Upload | **tus (résumable)** *(nouveau)* | Sources 60 min / plusieurs Go |
| IA générative | API Claude (Anthropic) | Prompts templatés par cas d'usage |
| Temps réel | WebSocket (Nest Gateway) | Avancement jobs vidéo, mises à jour pipeline, Inbox |
| Connecteurs | `packages/connectors/{meta,tiktok}` | Un adaptateur par réseau, credentials chiffrés par tenant |

**Règle** : l'API ne fait jamais d'appel réseau long en synchrone — elle écrit un job dans
Redis et répond. Les workers portent le travail lourd et sont mis à l'échelle indépendamment.

### Types de jobs

| Job | Déclencheur | Idempotence | Retry |
|---|---|---|---|
| `publish.target` | Scheduler à l'heure programmée | clé = `targetId`, statut vérifié avant envoi | 3 tentatives (backoff expo) → `ACTION_REQUISE` |
| `video.ingest` | Upload terminé | `mediaAssetId` + checksum | 2 ; produit le proxy + probe |
| `video.transcribe` | Proxy prêt | `mediaAssetId` + checksum | 2 → job échoué visible ; cache par checksum |
| `video.analyze.signal` | Proxy prêt (parallèle) | `videoProjectId` + `analysisVersion` | 2 ; plans / silences / énergie |
| `video.analyze.diarize` | Proxy prêt (parallèle) | idem | 2 ; tours de parole |
| `video.select` | transcribe + analyze finis (**join**) | `videoProjectId` + `analysisVersion` | 2 ; LLM → `VideoClip[]` scorés + hooks |
| `video.render` | Clip sélectionné (fan-out format × variante) | `renderJobId` | 2 ; rendu partiel supprimé |
| `video.formatcheck` | Rendu prêt | `renderJobId` + `network` | 1 ; PASS/WARN/FAIL |
| `analytics.pull` | CRON horaire par compte | upsert `(accountId, date, metric)` | silencieux ; alerte après 6 échecs |
| `token.refresh` | CRON quotidien, token < 7 j | `socialAccountId` | échec → capacité `EXPIRED` |
| `report.monthly` | CRON le 1er, ou manuel | `(clientId, période)` | 2 |

---

## 4. Modèle de données

Toutes les nouvelles tables : `tenantId` non nullable + index, couvertes par la RLS,
conventions Agency Hub (`createdAt/updatedAt`, `@@map` snake_case, anonymisation RGPD).

### 4.1 Réutilisées telles quelles

`Tenant`, `User`, `Role`, `Permission`, `Company`, `Campaign`, `Notification`,
`AutomationRule / AutomationRun`, `AiConversation / AiMessage`, `Quote / Invoice / Payment`,
`Subcontractor`, `Project / Task / TimeEntry`.

### 4.2 Étendues

| Entité | Champs ajoutés | Raison |
|---|---|---|
| `ContentItem` | `brief`, `toneOverride`, `primaryMediaId` | Contenu décliné multi-réseaux |
| `MediaAsset` | `kind` (VIDEO/PHOTO/AUDIO/LOGO/TEMPLATE/DOC), `lifecycle` (BRUT/MONTAGE/FINALISE/PUBLIE), `folderId`, `personTag`, `durationMs`, `width/height`, `checksum` | Médiathèque filtrable ; contrôle de format |
| `Company` | `brandKit BrandKit?`, `aiContext Json`, `healthStatus` (GREEN/AMBER/RED calculé) | Workspace client |
| `AutomationTrigger` | + `CONTENT_VALIDATED`, `VIDEO_RENDERED`, `PUBLICATION_FAILED`, `ACCOUNT_EXPIRED` | Automatisations du module |
| `NotificationType` | + `PUBLICATION_DUE`, `PUBLICATION_FAILED`, `CLIENT_VALIDATED`, `CLIENT_CHANGE_REQUEST`, `ACCOUNT_DISCONNECTED`, `VIDEO_READY` | Notifs de la chaîne |

### 4.3 Nouvelles entités

| Entité | Rôle | Champs clés |
|---|---|---|
| `SocialAccount` | Compte réseau connecté d'un client | `network`, `externalId`, `handle`, `accessTokenEnc`, `refreshTokenEnc`, `scopes[]`, `tokenExpiresAt`, `status`, `lastSyncAt`, `webhookSecret` |
| `SocialAccountCapability` | Ce que le compte peut faire à l'instant T | `capability` (AUTO_PUBLISH/DRAFT_ONLY/MANUAL/UNVERIFIED/EXPIRED), `reason`, `checkedAt` |
| `Publication` | Intention éditoriale (le « quoi ») | `status` (réutilise `ContentStatus`), `scheduledAt`, `contentItemId`, `campaignId`, `companyId` |
| `PublicationTarget` | Déclinaison pour un réseau (le « où ») | `network`, `caption`, `hashtags[]`, `mediaIds[]`, `status`, `mode` (AUTO/DRAFT/MANUAL), `externalPostId`, `publishedAt`, `lastError` |
| `PublicationAttempt` | Trace d'une tentative d'envoi | `attemptNumber`, `outcome` (OK/RETRY/FAILED), `errorCode`, `errorDetail`, `providerResponse Json` |
| `SocialWebhookEvent` | Événement entrant d'un réseau (idempotence) | `network`, `externalEventId` (unique), `type`, `payload Json`, `processedAt` |
| `MediaFolder` | Dossiers du client (01–Branding … 08–Archives) | `name`, `order`, `rule Json?` (dossier dynamique) |
| `BrandKit` | Identité de marque | `logos[]`, `colors Json`, `fonts Json`, `toneOfVoice`, `ctaLibrary[]`, `defaultHashtagSetId` |
| `SubtitleTemplate` | Style de sous-titres réutilisable | `font`, `position`, `size`, `animation`, `color`, `strokeColor`, `logoOverlayId` |
| `CaptionTemplate` | Gabarit de légende par plateforme & ton | `network`, `tone`, `body`, `placeholders[]` |
| `HashtagSet` | Jeu de hashtags nommé | `name`, `tags[]`, `kind` (GENERAL/NICHE/GEO/BRAND) |
| `VideoProject` | Source longue importée au Studio | `sourceMediaId`, `proxyMediaId`, `sourceDurationMs`, `sourceWidth/Height/Fps`, `analysisVersion`, `stageStatus Json` (ingest/transcribe/analyze/select), `lang`, `style`, `costCents` |
| `Transcript / TranscriptSegment` | Transcription horodatée **au mot** | `lang`, `text` ; segment : `startMs`, `endMs`, `speaker`, `confidence`, `words Json` (`[{text,startMs,endMs,confidence}]` — karaoké + coupes propres) |
| `VideoClip` | Extrait candidat scoré par l'IA | `startMs`, `endMs`, `scoreBreakdown Json` (hook/autonomy/clarity/pace/emotion/lengthFit), `hookText`, `hookVariants Json`, `reason`, `topicLabel`, `editDecisionList Json`, `parentClipId`, `selected`, `targetDurations[]` |
| `RenderJob` | Export d'1 clip × 1 format × 1 variante | `clipId`, `variantLabel`, `aspect`, `cropPath Json?`, `zoomEvents Json?`, `captionStyleId`, `options Json`, `status`, `previewMediaId`, `outputMediaId`, `costCents`, `engineVersion` |
| `FormatCheck` | Contrôle anti-erreur d'un média/target | `network`, `checks Json` (résolution, durée, ratio, audio, poids), `result` (PASS/WARN/FAIL) |
| `AnalysisFeature` | Résultat brut d'analyse signal (1 ligne / type) | `videoProjectId`, `kind` (SHOTS/SILENCES/SPEAKERS/ENERGY/TOPICS), `data Json`, `analysisVersion`, `computedAt` |
| `ClipFeedback` | Retour analytics → sélection (boucle fermée) | `videoClipId`, `publicationTargetId`, `metricSnapshot Json`, `performedWell Bool?` |
| `ValidationRequest` | Lot de contenus envoyés au client | `status` (OPEN/PARTIAL/CLOSED), `dueAt`, `channel` (portail/WhatsApp/email) |
| `ValidationDecision` | Décision du client sur un contenu | `decision` (APPROVED/REJECTED/CHANGES), `decidedBy`, `decidedAt` |
| `ContentComment` | Fil horodaté sur un contenu | `authorId` (agence ou client), `body`, `attachmentIds[]`, `resolvedAt` |
| `AnalyticsSnapshot` | Photo quotidienne d'un compte | `date`, `followers`, `reach`, `impressions`, `engagementRate` |
| `ContentMetric` | Métriques d'un post publié | `views`, `likes`, `comments`, `shares`, `saves`, `watchTimeMs`, `collectedAt` |
| `AiInsight` | Observation générée par l'IA | `scope` (CLIENT/CAMPAIGN), `text`, `evidence Json`, `confidence`, `period` |
| `ClientPlan` | Abonnement souscrit | `name`, `priceMonthly`, `currency`, `startedAt`, `billingDay` |
| `PlanQuota / PlanUsage` | Quotas du pack & consommation | quota : `metric` (POSTS/VIDEOS/STORIES), `limit`, `period` ; usage : `metric`, `used`, `periodStart` |
| `MonthlyReport` | Rapport client généré | `period`, `pdfMediaId`, `highlights Json`, `sentAt` |
| `ProjectFinance` | Économie d'un projet | `soldPrice`, `costLines Json`, `margin` (calculé) |
| `ProviderAssignment` | Affectation prestataire | `role`, `agreedRate`, `date`, `status`, `ratingInternal` |
| `ActivityLog` | Journal append-only | `actorId`, `action`, `entityType`, `entityId`, `diff Json`, `at` |

Groupes (le client `Company` est le pivot) : **Publication**, **Studio vidéo**, **Validation**,
**Analytics**, **Commercial**. Aucune requête ne traverse un `tenant_id` ; `ActivityLog` trace
chaque transition.

---

## 5. Rôles & permissions

RBAC fin en place : `Permission` (`domaine.ressource.action`) agrégée par `Role` (par tenant).
Le rôle **Admin** créé à l'inscription porte `*`. Le rôle **Client** n'accède qu'au portail de
validation (déjà appliqué via `user.isClient` dans `dashboard/layout.tsx`).

### Nouvelles permissions

```
social.accounts.read · social.accounts.connect · social.accounts.disconnect
studio.projects.read · studio.projects.write · studio.render.run
publishing.targets.read · publishing.targets.write · publishing.schedule · publishing.publish_now
validation.requests.manage · validation.decide (client)
analytics.read · analytics.insights.read
plans.read · plans.manage · reports.generate · finance.margin.read · brandkit.write · activity.read
```

### Matrice rôles × capacités

| Capacité | Admin | Resp. agence | Community M. | Monteur | Graphiste | Photographe | Client |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Voir le dashboard agence | ✓ | ✓ | ✓ | ~ | ~ | ~ | ✕ |
| Créer / modifier un client | ✓ | ✓ | ✕ | ✕ | ✕ | ✕ | ✕ |
| Connecter / déconnecter un réseau | ✓ | ✓ | ✓ | ✕ | ✕ | ✕ | ✕ |
| Importer dans la médiathèque | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✕ |
| Utiliser le Studio Vidéo IA | ✓ | ✓ | ~ | ✓ | ✕ | ✕ | ✕ |
| Lancer un rendu / export | ✓ | ✓ | ✕ | ✓ | ✕ | ✕ | ✕ |
| Rédiger légende / hashtags | ✓ | ✓ | ✓ | ~ | ✕ | ✕ | ✕ |
| Programmer une publication | ✓ | ✓ | ✓ | ✕ | ✕ | ✕ | ✕ |
| Publier maintenant | ✓ | ✓ | ~ | ✕ | ✕ | ✕ | ✕ |
| Envoyer un lot en validation | ✓ | ✓ | ✓ | ✕ | ✕ | ✕ | ✕ |
| Valider / demander une modif | ✕ | ✕ | ✕ | ✕ | ✕ | ✕ | ✓ |
| Commenter un contenu | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Voir statistiques & insights | ✓ | ✓ | ✓ | ✕ | ✕ | ✕ | ~ |
| Générer / envoyer le rapport mensuel | ✓ | ✓ | ✓ | ✕ | ✕ | ✕ | ✕ |
| Gérer packs & quotas | ✓ | ✓ | ✕ | ✕ | ✕ | ✕ | ✕ |
| Voir la marge agence | ✓ | ✓ | ✕ | ✕ | ✕ | ✕ | ✕ |
| Gérer l'équipe & les accès | ✓ | ~ | ✕ | ✕ | ✕ | ✕ | ✕ |

`✓` autorisé · `~` selon périmètre affecté (clients / tâches assignés) · `✕` interdit.

---

## 6. Arborescence écran par écran

Chaque écran : **Rôle · Composants · Actions/boutons · États & cas limites**. Identifiants
`E-xx` = référence pour les tickets.

### 6.0 — Navigation globale (E-00)
Barre de contexte **Mode Agence 🔵 / Mode Client 🟣**. Sélecteur de mode ; combo de recherche
client (nom, activité) avec récents ; fil d'Ariane `Agence › Client › Écran` ; cloche de
notifications ; recherche globale (contenus, médias, tâches). Actions : Entrer dans le client ·
Retour agence · Client suivant/précédent (raccourci). Client en rouge → bannière d'alerte
persistante. `isClient` → barre masquée, redirigé vers le portail.

### 6.1 — Aujourd'hui (E-01)
Page de travail par défaut. Compteur global ; groupes : vidéos à monter, légendes à écrire,
contenus à valider (relancer le client), publications à programmer, erreurs de publication.
Chaque ligne = client + échéance + action directe. Actions : ouvrir · Marquer fait · Reporter ·
Déléguer. Rien à faire → écran « journée dégagée » + échéances à 48 h. Item bloqué → `action requise`.

### 6.2 — Inbox (E-02)
Centre de contrôle des événements entrants : demandes de modif client, validations,
déconnexions de réseaux, erreurs TikTok/Meta, livrables prestataires. Liste chronologique
filtrable ; action contextuelle par entrée ; pastille de sévérité. Alimentée par `Notification`
+ `ActivityLog` + `SocialWebhookEvent`, temps réel WebSocket. Une entrée « erreur » reste en
tête tant qu'elle n'est pas résolue.

### 6.3 — Dashboard agence (E-03)
Voir immédiatement où est le problème. **Aujourd'hui** : publications prévues, vidéos en
montage, contenus à valider, erreurs, clients à relancer. **Cette semaine** : publications
programmées par réseau, vidéos prêtes. **Clients** : nombre d'actifs + répartition 🟢🟠🔴.
Widgets déplaçables. `healthStatus` calculé par job horaire : rouge si réseau expiré OU
publication échouée OU quota dépassé OU validation en retard. Étend `modules/dashboard`.

### 6.4 — Liste des clients (E-04)
Tableau : client · offre · indicateur 🟢🟠🔴 · quota (14/20) · prochaine publication ·
responsable. Vue cartes avec logo. Actions : Nouveau client · Entrer dans le workspace ·
filtres (statut, responsable, réseau manquant) · tri par urgence. Client sans réseau → badge
« à configurer ».

### 6.5 — Workspace client (E-05)
Onglets : Vue d'ensemble · Infos & équipe (contacts, community manager, monteur, photographe,
responsable) · Réseaux · Brand Kit · Médiathèque · Calendrier · Contenus/Pipeline · Validation ·
Stats · Rapports · Abonnement · Finance. Fiche de contexte IA (public, ton, langues, objectif).
Bandeau d'état si santé orange/rouge, avec motif exact + bouton de correction.

### 6.6 — Connexion des réseaux / Account Manager (E-06)
Une carte par réseau : logo, `@handle`, **statut de capacité** (Publication auto / Brouillon /
Action manuelle / Connexion expirée / Non audité), **dernière synchro**, scopes accordés, date
d'expiration du token. Actions : Connecter (OAuth) · Reconnecter · Révoquer · Tester ·
Rafraîchir maintenant · journal des tentatives. Token < 7 j → carte orange. Échec de
rafraîchissement → capacité `EXPIRED` + Inbox + notification. Le reste de la chaîne continue en
mode dégradé (brouillon / manuel).

### 6.7 — Médiathèque (E-07)
Grille + vignettes + durée/format ; recherche plein texte ; filtres : type, statut (brut /
montage / finalisé / publié), campagne, personne. **Dossiers intelligents** (01–Branding …
08–Archives) dont dynamiques (par règle). **Tags** libres (#interview #concert #produit …).
Actions : Importer (glisser-déposer multi) · Envoyer au Studio · Créer une publication depuis… ·
déplacer/taguer en masse · générer une miniature · Contrôler le format. Fichier corrompu / sans
audio → badge d'avertissement dès l'import.

### 6.8 — Studio Vidéo IA — import & analyse (E-08)
Lecteur avec timeline : pistes silences, plans, temps forts, transcription synchronisée.
Panneau **clips détectés** (« 12 clips potentiels ») : score, hook proposé, durée cible
(30/45/60 s). Actions : Générer des shorts · sélectionner/rejeter un clip · ajuster
entrée/sortie · Modifier le hook · analyse dans une autre langue. États : Transcription… →
Analyse… → Prêt (jobs async, progression WebSocket).

### 6.9 — Montage automatique & styles (E-09)
9:16, suppression des silences, recadrage & zoom dynamique, cuts, transitions, amélioration
audio, détection & cadrage du visage. Sélecteur de **style** (Clean · Dynamic · Podcast ·
Artiste · Business) ; options cochables ; aperçu ; sélecteur de `SubtitleTemplate` du client.
Actions : Prévisualiser · Lancer le rendu (`RenderJob`) · Dupliquer vers un autre format ·
Enregistrer comme style client. Le média finalisé retombe dans la médiathèque en statut
**finalisé**.

### 6.10 — Sous-titres intelligents (E-10)
Transcription auto → sous-titres stylés via le **template du client** (police, position,
animation, couleur, logo). Éditeur ligne à ligne synchronisé. Options : automatique, mot-à-mot,
style dynamique, position, taille, police. Segments à faible confiance surlignés. Multilingue :
une piste par langue. Export `.srt`.

### 6.11 — Générateur de légendes (E-11)
Légende **par plateforme** (IG / FB / TikTok) à partir du média + contexte client. Sélecteur de
**ton** (professionnel, humain, premium, humoristique, inspirant, artiste) hérité du Brand Kit ;
3 zones éditables ; compteur de caractères par réseau. Actions : Générer · Régénérer ·
Traduire (FR/PT/créole/EN) · Enregistrer comme `CaptionTemplate` · appliquer aux
`PublicationTarget`. Jamais publié sans relecture humaine.

### 6.12 — Générateur de hashtags (E-12)
Hashtags **généraux / niche / géographiques / de marque** à partir du sujet. 4 colonnes ;
**sets enregistrés** (`HashtagSet`) réutilisables. Actions : Générer · glisser vers la légende ·
Créer un set · définir le set par défaut du client. Alerte si un hashtag dépasse la limite du
réseau ou est signalé bloqué.

### 6.13 — Calendrier éditorial (E-13)
Vue mois / semaine ; carte = miniature + réseaux ciblés + statut + heure. Filtres : client (en
mode agence), réseau, campagne, statut, responsable. Colonne « non programmés ». Actions :
**glisser-déposer** pour reprogrammer · Nouvelle publication sur un créneau · Dupliquer ·
Programmer en lot · suggestions d'horaires (insights). Carte orange si un réseau ciblé est en
mode dégradé, rouge si échec. Créneau passé → non déposable. Conflit de quota → avertissement.

### 6.14 — Éditeur de publication multi-réseaux (E-14)
En-tête commun (titre interne, campagne, média principal). Onglets réseaux : **Instagram**
(légende A) · **TikTok** (légende B) · **Facebook** (légende C), chacun avec ses médias,
hashtags, options. Panneau **checklist anti-erreur** live (10 points : bonne vidéo, bon client,
bon réseau, format OK, légende, hashtags, date, heure, compte connecté, validation client).
Actions : cocher les réseaux cibles · générer les légendes · Contrôler les formats · Envoyer en
validation · Programmer · Publier maintenant · Enregistrer le brouillon. Un item rouge bloque
uniquement le réseau concerné.

### 6.15 — Pipeline de publication (E-15)
Kanban : Brouillon · Montage · À valider · Validé · Programmé · Publication en cours · Publié ·
**Action requise**. Carte = contenu + réseaux + échéance + assigné. Glisser entre colonnes =
transitions autorisées. « Action requise » = agrégat des `PublicationTarget` en `ACTION_REQUISE`
/ `FAILED`, chacune avec cause & bouton. S'appuie sur `ContentStatus` + statut par target.

### 6.16 — Validation client (E-16)
Agence + portail client. Liste « X contenus à valider » ; par contenu : aperçu par réseau,
légende, **fil de commentaires** horodaté (client ↔ monteur), pièces jointes. Client : Valider ·
Refuser · Demander une modification (+ commentaire). Agence : Envoyer un lot · Relancer ·
Marquer corrigé (renvoie en validation). Décision « modification » → retour Montage, fil
conservé. Notification portail + WhatsApp/email selon `channel`. Journalisé (`ValidationDecision`
+ `ActivityLog`).

### 6.17 — Équipe & tâches (E-17)
Réutilise `Project / Task` (TODO · IN_PROGRESS · IN_REVIEW · DONE, priorités, sous-tâches,
dépendances, `TimeEntry`). Vue par client / personne / échéance. Lier une tâche à un contenu ou
un clip · logguer du temps. Rôles : Admin, Community Manager (publications + calendrier),
Monteur (vidéos), Graphiste (créations), Photographe (médias), Client (validation seule).

### 6.18 — Automatisations (E-18)
Règles **Quand → Alors**. Ex. : *quand une vidéo est validée* → générer les sous-titres, créer
les versions TikTok/Instagram/Facebook, générer la légende, proposer des hashtags, ajouter au
calendrier. Éditeur trigger → conditions → actions (réutilise `AutomationRule.actions Json`).
Bibliothèque de règles préfaites. Journal (`AutomationRun`). Nouveaux triggers :
`CONTENT_VALIDATED`, `VIDEO_RENDERED`, `PUBLICATION_FAILED`, `ACCOUNT_EXPIRED`. Test à blanc
(dry-run) · dupliquer vers un autre client.

### 6.19 — Campagnes (E-19)
Réutilise `Campaign`. Regroupe et suit tous les contenus d'une opération (ex. « Nouveau clip » :
teaser 01/02, interview, backstage, extrait, making-of, clip officiel). Vue chronologique,
avancement (publiés / plan), budget, contenus manquants. Alerte si un jalon approche sans
contenu prêt.

### 6.20 — Banque de templates & Brand Kit (E-20)
Templates créés une fois au niveau tenant (Reel interview, Reel artiste, annonce événement,
promo produit, citation, témoignage, story), réutilisés pour tous les clients. Brand Kit au
niveau client : logo, couleurs, polices, ton, hashtags, CTA, templates. Association template ↔
style de sous-titres ↔ set de hashtags. Un template **verrouillé** impose police/couleurs.

### 6.21 — Statistiques par réseau (E-21)
Vues, portée, likes, commentaires, partages, enregistrements, abonnés, taux d'engagement.
Séries temporelles (`AnalyticsSnapshot`), tableau de performance des contenus (`ContentMetric`),
**Top 10**, comparaison de périodes, filtre par type. Badge « dernière synchro » par réseau ;
trou de données signalé si l'API a échoué.

### 6.22 — Insight IA (E-22)
Transforme les stats en conseils : « vidéos < 45 s = plus de vues », « le soir engage
davantage », « une question dans les 3 premières secondes performe mieux ». `AiInsight` avec
preuve chiffrée + confiance ; lien vers le calendrier (reco d'horaire) ou le Studio (durée
cible). Générer les insights du mois · marquer utile/non pertinent · Créer une règle depuis un
insight. Aucun insight si < N contenus publiés.

### 6.23 — Rapports mensuels (E-23)
Évolution abonnés/vues/portée par réseau, meilleur contenu, faits marquants. Aperçu web +
**export PDF** aux couleurs du Brand Kit ; commentaire éditorial (rédaction assistée IA).
Générer (job) · Éditer le commentaire · Envoyer au client (portail + email) · planifier l'envoi
le 1er. Étend `modules/reporting` ; stocké en `MonthlyReport` (PDF S3), `sentAt` à l'envoi.

### 6.24 — Abonnements & quotas (E-24)
Suivre ce que prévoit l'abonnement (ex. Pack Réseaux Premium 1 290 €/mois : 20 publications,
12 vidéos, 8 stories, gestion IG/TikTok/FB) et la consommation réelle (« 14 / 20 »). Barres de
quota (`PlanQuota` vs `PlanUsage`), historique par mois, lien facturation. Définir/changer le
pack · ajuster les quotas · Facturer (crée un `Invoice` depuis `ClientPlan`). Quota atteint →
avertissement à la programmation, pas un blocage dur ; dépassement → santé orange.

### 6.25 — Finance interne / marge par projet (E-25)
`ProjectFinance` : prix vendu − coûts vidéaste/monteur/photographe (liés à des `Subcontractor`),
marge calculée ; agrégat par client et par mois. Réservé Admin / Responsable agence. Marge
négative surlignée.

### 6.26 — Prestataires & affectation (E-26)
Réutilise `Subcontractor` (identité, société, SIRET, IBAN, assurances, TJM, zone, dispo,
notes). Ajout `ProviderAssignment` (rôle, tarif convenu, date, évaluation interne 4,8/5).
Créer une fiche · Affecter à un projet/tâche · noter après mission · filtrer par dispo/zone/
note. Assurance ou pièce d'identité expirée → fiche signalée.

### 6.27 — Journal d'activité (E-27)
Flux `ActivityLog` filtrable par client, entité, acteur, période ; diff avant/après.
Append-only, non modifiable. Conservation selon la politique de rétention.

### 6.28 — Paramètres & sécurité (E-28)
MFA (TOTP, en place), sessions actives, appareils, rôles & permissions, connexions sociales du
tenant, export / effacement RGPD. Forcer la déconnexion · Désactiver un compte (coupe tous les
accès + retire des affectations, révoque les `RefreshToken`) · Anonymiser · régénérer les
secrets de webhook.

---

## 7. Workflows clés

### 7.1 Pipeline de publication avec fallback par capacité

`Brouillon → À valider → Validé → Programmé`. À l'heure H, le scheduler crée un job
`publish.target`. Le worker lit la **capacité du compte** :

- `AUTO_PUBLISH` → envoi API (tentatives 1..3, backoff) → `Publié` + collecte des métriques ;
  après 3 échecs → `Action requise` (cause + bouton).
- `DRAFT_ONLY` → dépose un brouillon côté réseau + notifie « finaliser dans l'app ».
- `MANUAL` / `UNVERIFIED` → crée un rappel avec média + légende prêts à copier.
- `EXPIRED` → bloque **ce compte uniquement** ; bouton Reconnecter ; Inbox.

Chaque `PublicationTarget` est indépendante : IG peut être « Publié » pendant que TikTok est en
« Action requise ». La chaîne n'est jamais bloquée dans son ensemble.

### 7.2 Studio vidéo — chaîne asynchrone

`Upload résumable (+ checksum) → Ingest (proxy + probe) → [Transcription au mot ∥ Analyse
signal ∥ Diarisation] → (join) Sélection LLM (clips scorés + hooks A/B) → [Choix opérateur] →
Rendu (fan-out : format × variante — silences, recadrage active-speaker, sous-titres mot-à-mot,
loudnorm) → Contrôle format réseau → Médiathèque (lifecycle finalisé)`. Jobs BullMQ en **DAG**
(fan-out analyse → join sélection → fan-out rendu), progression WebSocket par étape ; l'échec
d'un job est visible et n'efface pas les précédents. Cache par `checksum` (ré-import = pas de
ré-analyse). Seule l'étape « Choix » est bloquante côté humain ; une automatisation peut
enchaîner Rendu → contrôle → publication programmée. Rendu limité aux clips **sélectionnés** ×
formats **demandés** ; les variantes ne re-rendent que les ~2 s de hook. Détail complet :
[`STUDIO-VIDEO-IA.md`](./STUDIO-VIDEO-IA.md) §3.

### 7.3 Validation client — boucle

`Lot en attente (ValidationRequest)` → le client : **Validé** → pipeline publication ·
**Modification demandée** → retour Montage (le monteur corrige, le fil `ContentComment` est
conservé) → revient en attente · **Refusé** → archivé. Chaque décision écrit une
`ValidationDecision` + une ligne d'`ActivityLog`. Notification portail + WhatsApp/email.

### 7.4 Autres

- **Connexion d'un réseau** : Connecter → OAuth (scopes minimaux) → token chiffré → premier
  `analytics.pull` → capacité calculée. CRON quotidien `token.refresh` ; échec → `EXPIRED` + Inbox.
- **Automatisation « vidéo validée »** : trigger `CONTENT_VALIDATED` → générer sous-titres,
  créer targets IG/TikTok/FB, générer légendes, proposer hashtags, placer au calendrier sur un
  créneau suggéré → `SCHEDULED`.
- **Rapport mensuel** : CRON le 1er → `report.monthly` par client → agrège `AnalyticsSnapshot`
  + `ContentMetric` + `AiInsight` → PDF Brand Kit → `MonthlyReport` → envoi.
- **Checklist anti-erreur** : recalcul live des 10 points à chaque modification de E-14 ;
  `FormatCheck` relancé si un média change ; « Programmer » désactivé tant qu'un point commun
  est rouge.

---

## 8. Couche réseaux sociaux

Ne pas supposer que les trois réseaux offrent les mêmes possibilités. Un adaptateur par réseau ;
chaque compte porte un **statut de capacité** qui pilote l'UI et le moteur.

### Statuts de capacité

| Capacité | Signification | Comportement du moteur |
|---|---|---|
| `AUTO_PUBLISH` | App auditée, scopes OK, token valide | Publication directe à l'heure programmée |
| `DRAFT_ONLY` | API limitée à l'envoi en brouillon / inbox | Dépose un brouillon + notifie |
| `MANUAL` | Aucune publication programmatique fiable | Crée un rappel (média + légende prêts) |
| `UNVERIFIED` | App pas encore auditée | Se comporte comme DRAFT_ONLY ou MANUAL |
| `EXPIRED` | Token invalide / autorisation révoquée | Bloque ce compte ; bouton Reconnecter ; Inbox |

### Matrice indicative par réseau *(à vérifier avant chaque implémentation)*

| Fonction | Instagram | Facebook | TikTok |
|---|---|---|---|
| API de référence | Instagram Graph API (compte pro/creator + Page) | Facebook Graph API (Page) | TikTok Content Posting API |
| Publication auto (feed / Reel / vidéo) | ✓ (container → publish) | ✓ | ✓ si app auditée · sinon brouillon |
| Publication photo carrousel | ✓ | ✓ | ✓ (photo mode, récent) |
| Stories | partiel / contraint | partiel | n/a |
| Envoi en brouillon / inbox | non | non | ✓ (upload to inbox) |
| Étapes UX imposées | revue d'app Meta, permissions avancées | revue d'app Meta | écran de confirmation dans l'app TikTok, audit pour la publication directe |
| Métriques | ✓ insights | ✓ insights | ✓ limité / selon scopes |
| Webhooks | via Meta | via Meta | limités |

Chaque adaptateur déclare ses fonctions supportées et les fait remonter dans
`SocialAccountCapability`. Prévoir : revue d'app Meta, audit TikTok, mode dégradé fonctionnel
tant que l'audit n'est pas obtenu.

### Tokens & webhooks

- `accessTokenEnc` / `refreshTokenEnc` chiffrés (V1 : posture identique à
  `WhatsAppChannel.whapiToken` — jamais renvoyés par un `GET` ; cible : AES-256 + clé KMS).
- `token.refresh` quotidien ; fenêtre 7 jours ; échec → `EXPIRED`.
- Webhooks vérifiés par signature ; `SocialWebhookEvent.externalEventId` unique (idempotence).
- Rate-limits gérés par l'adaptateur ; un 429 déclenche un backoff, pas un échec.

---

## 9. IA — cas d'usage & garde-fous

**Fiche de contexte client** (`Company.aiContext` JSON, rappelée dans chaque prompt) : type de
client, public (ex. diaspora capverdienne), ton, objectif, langues (FR / PT / créole).

| Usage | Entrée | Sortie | Exécution |
|---|---|---|---|
| Détection clips & hooks | Transcription + analyse signal | `VideoClip[]` (score, hook, raison) | job `video.analyze` |
| Légendes par plateforme | Média + contexte + ton | 3 variantes éditables | sync ou job court |
| Hashtags | Sujet + géo + marque | 4 catégories | sync |
| Insights | `ContentMetric` agrégés | `AiInsight[]` avec preuve | job mensuel / à la demande |
| Commentaire de rapport | Chiffres du mois | Paragraphe éditorial | job `report.monthly` |
| Résumé d'un fil de validation | `ContentComment[]` | Liste des changements demandés | sync |

Garde-fous : humain dans la boucle (aucune sortie publiée sans validation opérateur puis
client) · RAG filtré par `tenant_id` · générations longues en jobs + quotas IA par tenant ·
langue de sortie explicite · origine (modèle, prompt template, date) tracée dans `ActivityLog`.

---

## 10. Sécurité & conformité

| Sujet | Mesure | État |
|---|---|---|
| Isolation des données | RLS sur toutes les tables ; rôle applicatif sans `BYPASSRLS` ; storage préfixé par tenant | en place · à étendre |
| OAuth réseaux | Scopes minimaux ; écran de consentement ; révocation depuis E-06 et E-28 | nouveau |
| Chiffrement des tokens | AES-256 applicatif + clé KMS ; jamais exposés en lecture | motif WhatsApp à généraliser |
| Authentification | JWT access + refresh ; MFA TOTP ; sessions révocables | en place |
| Départ d'un employé | Désactivation immédiate : révoque les refresh tokens, retire des équipes et `ProviderAssignment` | à compléter |
| Journalisation | `ActivityLog` append-only (connexions, exports, permissions, portail, publication) | nouveau (généralisation) |
| Sauvegardes | Quotidiennes + PITR PostgreSQL ; réplication du stockage objets | infra |
| RGPD | Registre des consentements (déjà sur `Contact`) ; export & effacement ; anonymisation `Subcontractor` ; rétention configurable | socle en place |
| Webhooks | Vérification de signature ; secret régénérable ; idempotence par `externalEventId` | motif WhatsApp à réutiliser |

---

## 11. Roadmap MVP → V2 → V3

> Ne pas développer les 40 fonctions d'un coup. Le MVP est déjà un logiciel puissant.
> **Le Studio est la tranche prioritaire** : c'est ce qui vend. Phasage Studio-first détaillé
> dans [`STUDIO-VIDEO-IA.md`](./STUDIO-VIDEO-IA.md) §7.

### V1 — MVP

| Lot | Contenu |
|---|---|
| Fondations | Modules `social`, `publishing`, `studio`, `validation`, `analytics`, `plans` ; Redis + BullMQ ; `worker-publish` & `worker-video` ; stockage objets |
| Navigation | Mode Agence / Client (E-00), Aujourd'hui (E-01), Inbox (E-02), Dashboard agence étendu (E-03) |
| Clients | Workspace & onglets (E-04/05), fiche contexte IA, Brand Kit minimal (E-20) |
| Réseaux | Connexion IG/FB/TikTok (E-06), statuts de capacité, refresh token, fallback |
| Médiathèque | Import, filtres, dossiers, tags, contrôle de format (E-07) |
| Studio IA *(tranche prioritaire)* | Upload résumable + proxy, ASR au mot (FR), retrait silences/tics, sélection LLM (8–15 clips scorés + 1 hook), rendu **9:16 seul**, **1** style de sous-titres mot-à-mot + template client, recadrage **center-crop + visage simple** (pas de tracking), aperçu + retouche in/out, « Envoyer vers publication » (E-08/09/10) |
| Studio IA — V1.5 | Recadrage active-speaker (tracking + Kalman), 3 styles de sous-titres, 4 formats + Original, variantes hook A/B/C, éditeur de sous-titres ligne-à-ligne, `FormatCheck` par réseau |
| IA texte | Légendes par plateforme (E-11), hashtags + sets (E-12) |
| Programmation | Calendrier drag & drop (E-13), éditeur multi-réseaux + checklist (E-14), pipeline (E-15) |
| Validation | Lots + décisions + fil de commentaires + portail client (E-16) |
| Stats | Ingestion métriques, séries par réseau, Top 10 (E-21) |

### V2

Automatisations avancées (E-18) · Insights IA (E-22) + rapports mensuels PDF automatiques
(E-23) ; `worker-analytics` & `worker-reports` · Campagnes complètes (E-19), banque de
templates + verrouillage de marque (E-20) · Studio : zoom / punch-in dynamiques, coupes
multi-locuteurs (diarisation), **score calibré sur les analytics réels** (`ClipFeedback` —
boucle fermée), pistes sous-titres multilingues (PT / créole), presets « style client » ·
Équipe & tâches liées aux contenus (E-17) ·
Abonnements & quotas (E-24) reliés à la facturation.

### V3

Finance interne : marge par projet (E-25), affectation prestataires + évaluation (E-26) · CRM
commercial complet : prospect → devis → client actif, packs vendables · Application mobile
(consomme l'API) : Aujourd'hui, Inbox, validation, push · Assistant IA stratégique
(recommandations proactives, règles depuis insights) · Option SaaS multi-agences (offres
Starter / Pro / Agency / Enterprise) — déjà permise par l'architecture (tenants).

---

## 12. Risques & décisions ouvertes

| Sujet | Risque | Piste |
|---|---|---|
| Audit TikTok / revue Meta | Délais longs ; publication directe indisponible au lancement | Lancer les demandes tout de suite ; MVP en `DRAFT_ONLY` / `MANUAL`, bascule `AUTO` à l'obtention |
| Montage automatique | Build interne coûteux ; **recadrage active-speaker** = le point dur (crop qui « saute » si bâclé) | Hybride : acheter la commodité, construire la sélection/score/UX ; V1 center-crop assumé, V1.5 OSS (LightASD), évaluer une API dédiée **après** avoir mesuré la qualité center-crop. Voir [`STUDIO-VIDEO-IA.md`](./STUDIO-VIDEO-IA.md) §2, §6 |
| Cible mouvante vs incumbents | Opus Clip / Vizard / Klap avancent vite sur la qualité de montage | Ne pas rivaliser sur le montage ; vendre l'**intégration agence** (clips → calendrier → validation → publication → résultats, multi-clients, Brand Kit auto, analytics qui nourrissent la sélection) |
| Coût & latence transcription / rendu | Facture IA + temps machine sur vidéos longues | Quotas par tenant, file dédiée, transcription à la demande, cache par `checksum` |
| Stockage vidéo | Volumétrie qui explose (4K + rendus) | Rétention des bruts, transcodage proxy, archivage froid |
| Rate-limits API réseaux | Blocage en pic de programmation | File par compte, backoff, lissage des créneaux |
| Multilingue créole | Qualité ASR & génération variable | Relecture humaine obligatoire, glossaire par client |
| Notifications client | WhatsApp via Whapi = dépendance tierce | Fallback email + portail ; canal abstrait (`ValidationRequest.channel`) |

### Prochaines étapes concrètes

1. Créer l'app Meta (Business) et le compte développeur TikTok ; lancer les revues d'app.
2. Poser les migrations Prisma des entités §4.3 + policies RLS (motif `subcontractors_rls`).
3. Monter Redis + BullMQ et le squelette `worker-publish` / `worker-video-gpu` / `worker-video-cpu`.
4. Implémenter l'adaptateur Meta (IG/FB) de bout en bout sur un client pilote, puis TikTok en `DRAFT_ONLY`.
5. Livrer la tranche verticale publication : E-06 → E-07 → E-14 → E-15 → E-21 pour un seul client réel.
6. **Tranche verticale Studio V1** sur une vraie vidéo d'un client pilote : upload → proxy →
   ASR → silences → `video.select` → aperçu → rendu 9:16 → médiathèque → publication. Itérer le
   prompt `video.select` sur ~10 vidéos réelles (pertinence des clips mesurée à la main).
   Migrations Prisma Studio : voir [`STUDIO-VIDEO-IA.md`](./STUDIO-VIDEO-IA.md) §9.

---

## Journal d'implémentation

| Date | Incrément | Contenu |
|---|---|---|
| 2026-09-07 | Cadrage | Ce document + artifact rendu |
| 2026-09-08 | Cadrage — Studio = cœur | Nouveau doc [`STUDIO-VIDEO-IA.md`](./STUDIO-VIDEO-IA.md). Studio Vidéo IA repositionné comme cœur du produit (façon Clipzi/Opus Clip). MàJ §1, §3 (workers GPU/CPU, tus, stockage étagé, DAG de 7 jobs), §4.3 (entités `VideoProject`/`TranscriptSegment`/`VideoClip`/`RenderJob` étendues + `AnalysisFeature`, `ClipFeedback`), §7.2 (chaîne async en DAG), §11 (V1 Studio resserré + V1.5, V2 boucle fermée), §12 (build vs buy hybride, risque cible mouvante, étape 6 tranche Studio). |
| 2026-09-07 | Increment 1 — socle publication | `schema.prisma` : enums + modèles `SocialAccount`, `SocialAccountCapability`, `Publication`, `PublicationTarget`, `PublicationAttempt`, `SocialWebhookEvent` ; migrations `add_social_publishing` + `social_publishing_rls` ; permissions `SOCIAL_PERMISSIONS` / `PUBLISHING_PERMISSIONS` ; modules API `social` et `publishing` (CRUD + transitions de statut, **sans** OAuth/adaptateurs/scheduler — increments suivants) |
| 2026-09-07 | Increment 2 — moteur de publication | Migration `publication_published_at` (colonne `publications.publishedAt`). `publishing/adapters/` : interface `NetworkAdapter` + `PublishError` + `FakeNetworkAdapter` (jetons de légende `[[fail]]` `[[flaky]]` `[[draft]]` `[[manual]]`) + `AdapterRegistry`. `PublisherService` : réclamation atomique des cibles dues (`FOR UPDATE SKIP LOCKED` via `PlatformPrismaService`, cross-tenant), fallback par capacité (`EXPIRED`/`MANUAL`/`UNVERIFIED` → `ACTION_REQUISE`), retries (backoff 30 s / 120 s, 3 tentatives) → `FAILED`, `PublicationAttempt` à chaque essai, roll-up publication `PUBLISHED` quand toutes les cibles le sont, ré-armement des cibles coincées en `PUBLISHING` > 10 min. `PublishSchedulerService` : `@Cron` toutes les 30 s, désactivable par `PUBLISH_SCHEDULER_ENABLED=false`. Endpoints `POST /publishing/publications/:id/publish-now` et `POST /publishing/targets/:targetId/run` (perm `publishing.publish_now`) pour traitement immédiat. Transport = polling SQL ; **BullMQ / worker dédié = swap ultérieur** derrière la même interface. Toujours **pas d'OAuth ni d'adaptateurs réseaux réels**. |
| 2026-09-07 | Increment 3 — OAuth Meta + adaptateur | `core/crypto` : `TokenCipherService` (AES-256-GCM, clé `TOKEN_ENCRYPTION_KEY`, passthrough si absente) + `CryptoModule` global. `social/meta/` : `MetaOAuthService` + `MetaOAuthController` — `GET /social/meta/connect?companyId=` (redirige vers le dialogue Facebook, contexte tenant/client dans un `state` JWT signé, TTL 10 min) et `GET /social/meta/callback` (`@Public`, échange code → jeton long-lived → `GET /me/accounts` → upsert `SocialAccount` FACEBOOK + INSTAGRAM avec jetons chiffrés ; capacité par défaut `UNVERIFIED`). `publishing/adapters/meta.adapter.ts` : `MetaAdapter` (IG : media container → poll → publish ; FB Page : `/feed` `/photos` `/videos`) ; erreur Graph code 190 → `TOKEN_INVALID` → le `PublisherService` bascule la capacité en `EXPIRED`. `AdapterRegistry` : `MetaAdapter` pour IG/FB si `META_APP_ID`+`META_APP_SECRET` présents, sinon `FakeNetworkAdapter`. Nouveaux env : `WEB_APP_URL`, `TOKEN_ENCRYPTION_KEY`, `META_*`. **Limite V1** : Instagram exige une URL média publique — seuls les `mediaIds` déjà en http(s) sont exploités (pipeline d'hébergement média à venir). **Non testable** tant que `META_APP_SECRET` + tunnel HTTPS absents. Pages web `apps/web/src/app/confidentialite` et `/cgu` (RGPD, suppression de données) — à déployer pour débloquer la vérification de domaine TikTok et l'App Review Meta. |
| 2026-09-08 | Increment 9 — import de médias dans le composeur | Le composeur `/dashboard/posts/nouveau` a maintenant une **zone glisser-déposer + sélecteur de fichiers** (upload via `POST /marketing/media` — pipeline existant, va sur le bucket S3/R2 configuré) et un panneau **« Choisir dans la bibliothèque »** (`GET /marketing/media`). Le post porte des **ids de `MediaAsset`** (`create-post.dto` : `mediaUrls` → `mediaIds`, accepte ids ou URLs). Résolution à la publication : `publishing/media-link.service.ts` — `MediaLinkService.resolve(mediaIds, tenantId)` → URLs via `StorageService.getPublicUrl(key)` (nouveau : `MEDIA_PUBLIC_BASE` ou `S3_ENDPOINT/bucket/key`). `PublisherService` résout avant d'appeler l'adaptateur. Fix lint pré-existant `LocalDiskDriver.readStream`. |
| 2026-09-08 | Increment 8 — simplification UX + thème sombre « futuriste » | Audit : trop de destinations, modèle publication→cible exposé, jargon. Refonte : `globals.css` en thème sombre (encre bleu-nuit, accent indigo `#6d5efc`, appoint cyan) + utilitaires `.glass` `.glow` `.gradient-text` `.brand-fill` `.dotgrid` `.input` — tout l'app suit via les tokens. Menu réduit : Général · Clients · Contenus (Posts, Bibliothèque, Campagnes) · Réglages. Shell refait (sidebar glass, bouton **＋ Créer un post** dans le header). Nouvelle page **`/dashboard/posts`** (liste unique, statut simple Brouillon/Programmé/Publié/Attention) + **`/dashboard/posts/nouveau`** (composeur une colonne : client → réseaux cochés → texte + ✨ hashtags → média → maintenant/programmer). Backend : `POST /publishing/posts` (un appel : crée `Publication` + `PublicationTarget[]` pour les réseaux connectés, publie ou programme, renvoie `skipped[]`). Anciens écrans `social/pipeline` et `social/accounts` conservés, réseul `accounts` reste dans le menu. Titre app → « Iniciativas Content ». |
| 2026-09-08 | Increment 7 — générateur de hashtags IA | `POST /ai/hashtags` (`{ topic, network?, count? }` → `{ hashtags: string[] }`), un appel Claude Haiku non streamé, sortie nettoyée (sans `#`, minuscules, dédupliquée). Bouton **« ✨ Générer »** à côté du champ hashtags dans l'éditeur de cible (`/dashboard/social/pipeline`) : utilise la légende comme sujet + le réseau du compte sélectionné. |
| 2026-09-08 | Increment 6 — recentrage « Iniciativas Content » (réversible) | `app.module.ts` : ne charge plus `BillingModule`, `ProjectsModule`, `DocumentsModule`, `PlanningModule`, `WhatsAppModule`, `SubcontractorsModule`, `PortalModule`, `ReportingModule` (code conservé dans le dépôt, réactivation = ré-ajouter l'import). `AutomationModule` reste (dépendance de `CrmModule`). Menu web `dashboard/layout.tsx` réduit à : Général (Tableau de bord, Assistant IA) · Clients · Contenus (Bibliothèque, Calendrier éditorial, Campagnes) · Réseaux sociaux · Administration (Équipe). Aucune table supprimée, aucune migration. |
| 2026-09-08 | Increment 5 — UI web (Réseaux) | Section de nav « Réseaux sociaux ». **`/dashboard/social/accounts`** (E-06) : liste des comptes par client, pastille de capacité, boutons « Connecter Instagram/Facebook » et « Connecter TikTok » (appel `GET /social/{provider}/connect` → `{ url }` → `window.location`), `<select>` de capacité (`PUT /social/accounts/:id/capability`), Reconnecter, Révoquer, bannière de retour OAuth. **`/dashboard/social/pipeline`** (E-14 + E-15) : création de publication, ajout de cibles réseau par publication (compte + légende + hashtags + URLs média), statut par cible + `lastError` + nb de tentatives, boutons Programmer / Publier maintenant / Réessayer une cible / supprimer. Backend : les endpoints `connect` renvoient désormais `{ url }` (JSON) au lieu d'une redirection ; le callback OAuth renvoie vers `/dashboard/social/accounts`. `apps/web/src/lib/api.ts` : ajout de `api.put`. `apps/web/src/lib/types.ts` : types `SocialAccount`, `Publication`, `PublicationTarget`, etc. **Non testable end-to-end** sans API lancée + secrets + tunnel. |
| 2026-09-08 | Increment 4 — OAuth TikTok + adaptateur | `social/tiktok/` : `TikTokOAuthService` + `TikTokOAuthController` — `GET /social/tiktok/connect?companyId=` + `GET /social/tiktok/callback` (`@Public`, `state` JWT). Échange code (`/v2/oauth/token/`) → `open_id` + access/refresh tokens → `user/info` pour le `display_name` → upsert `SocialAccount` TIKTOK (jetons chiffrés) ; capacité par défaut `DRAFT_ONLY` (app non auditée). `social/social-token.service.ts` : `SocialTokenService.ensureFreshAccessToken(account)` — rafraîchit le jeton TikTok (~24 h) via `refresh_token` avant chaque publication et le repersiste ; Meta = renvoie le jeton stocké ; échec → capacité `EXPIRED`. `PublisherService` utilise ce service au lieu de déchiffrer directement. `publishing/adapters/tiktok.adapter.ts` : `TikTokAdapter` (Content Posting API) — capacité `AUTO_PUBLISH` → publication directe (`/post/publish/video|content/init/`, `PUBLISHED`) ; sinon → dépôt boîte de réception (`/post/publish/inbox/video/init/`, `DRAFT_CREATED`). Erreur `access_token_invalid`/`scope_not_authorized` → `TOKEN_INVALID` → `EXPIRED`. `AdapterRegistry` : `TikTokAdapter` si `TIKTOK_CLIENT_KEY`+`TIKTOK_CLIENT_SECRET`, sinon Fake. `PublishingModule` importe désormais `SocialModule`. **Limites V1** : média = URL publique uniquement ; photo TikTok en boîte de réception non gérée ; publication directe non testable avant audit + vérif domaine PULL_FROM_URL. **Non testable** sans `TIKTOK_CLIENT_SECRET` + tunnel HTTPS. |
