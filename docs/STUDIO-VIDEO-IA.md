# Studio Vidéo IA — spec dédiée

> Version 0.1 — 2026-09-08. Le **cœur** d'Iniciativas Content : transformer automatiquement
> une vidéo longue en plusieurs shorts dynamiques, sous-titrés, correctement cadrés et prêts à
> publier, dans l'esprit de Clipzi / Opus Clip, mais **intégré au système de gestion des clients**.
>
> Contexte produit : [`VISION-INICIATIVAS-CONTENT.md`](./VISION-INICIATIVAS-CONTENT.md) §5–10.
> Détail écran par écran & reste du module : [`CAHIER-DES-CHARGES-RESEAUX.md`](./CAHIER-DES-CHARGES-RESEAUX.md) §6.8–6.10, §7.2.

---

## 1. Ce que « cœur du logiciel » implique

Le Studio n'est pas un module parmi six. C'est **le produit**. Trois conséquences :

1. Le **pipeline vidéo** devient la principale contrainte de scaling (avant le moteur de publication).
2. Le **GPU** est une ligne de coût récurrente : ASR, détection de visage, active-speaker, recadrage.
3. Le **stockage + egress** (bruts 4K + rendus × formats × variantes) domine la facture infra.

Le différenciateur n'est **pas** de battre Opus Clip sur la qualité du montage. C'est
**l'intégration agence** : les clips tombent directement dans le calendrier du client →
validation → publication → résultats, en vue multi-clients, Brand Kit appliqué
automatiquement, et les analytics **reviennent** alimenter la sélection. Un outil standalone
ne fait jamais le workflow agence.

---

## 2. Décision build vs buy — hybride

| Brique | Voie | Détail |
|---|---|---|
| Transcription (ASR) | **OSS / API** | `faster-whisper large-v3` self-host GPU, ou Deepgram / Groq Whisper en API. Timestamps **au mot** obligatoires. |
| Diarisation (qui parle) | **OSS** | `pyannote.audio`. |
| Détection de plans | **OSS** | `PySceneDetect` (content detector). |
| Silences / tics | **OSS** | `ffmpeg silencedetect` + gaps entre mots + liste de tics (« euh », « hum », « du coup »…). |
| Énergie / rires / emphase | **OSS** | RMS + pics de pitch (librosa / ffmpeg `astats`). |
| **Recadrage active-speaker** | **OSS lourd _ou_ API payante** | MediaPipe (visage + pose) + `LightASD` / `TalkNet-ASD` (locuteur actif) + lissage Kalman. **Point le plus dur** — budgéter du vrai temps ou l'acheter. Fallback V1 : center-crop + détection visage simple. |
| Rendu sous-titres | **OSS** | `libass` / format ASS (`\k` pour le karaoké mot-à-mot). |
| **Sélection des clips + hooks** | **CONSTRUIT** | LLM (Claude) sur transcription + features signal → segments scorés + hooks. C'est *notre* produit. |
| **Score, variantes A/B/C, EDL** | **CONSTRUIT** | Logique métier propre. |
| **UX aperçu / validation / retouche** | **CONSTRUIT** | — |
| **Rattachement publication + validation client** | **CONSTRUIT** | Le moat. |

Règle : **acheter la commodité, construire ce qui est le produit.**

---

## 3. Pipeline de bout en bout

```
INGEST
  upload résumable (tus) → S3 → ffprobe (codec, durée, fps, résolution, audio)
  → proxy 720p H.264 + audio normalisé -16 LUFS
  → cache par checksum (ré-analyse évitée)

ANALYSE  (fan-out, parallèle)
  ASR .................. faster-whisper large-v3, timestamps au mot   → Transcript / TranscriptSegment
  diarisation ......... pyannote                                       → tours de parole (speakers[])
  silences / tics ..... silencedetect + gaps + liste de tics          → cut list (silences[])
  plans .............. PySceneDetect                                   → frontières de plans (shots[])
  énergie / émotion .. RMS + pitch + (option) détection de rires      → energyMarkers[]
  (option) sujets .... LLM par fenêtres de transcription              → changements de sujet (topics[])

SÉLECTION  (join → LLM)
  in  : transcription horodatée + shots[] + silences[] + topics[] + energyMarkers[] + Company.aiContext
  out : 8–15 VideoClip candidats { startMs, endMs, raison, hookText, scoreBreakdown, topicLabel }
  score = hook + autonomie du propos + clarté + rythme + émotion + adéquation durée (30/45/60 s)
  → 2–3 variantes de hook (A/B/C) sur les clips les mieux scorés

[ CHOIX OPÉRATEUR ]  ← seule étape bloquante côté humain
  sélectionner / rejeter des clips · ajuster in/out · modifier le hook · relancer l'analyse (autre langue)

RENDU  (fan-out : par clip × format × variante)
  découpe sur keyframes
  → retrait silences / tics (concat filter, crossfade ~40 ms, jamais au milieu d'un mot)
  → recadrage 9:16 / 4:5 / 1:1 : tracking locuteur actif → trajectoire de crop lissée (Kalman)
     → punch-in léger sur changements de plan (zoomEvents)
  → incrustation sous-titres (libass, SubtitleTemplate du client, karaoké mot-à-mot)
  → overlay logo → loudnorm → export H.264 + miniature
  → MediaAsset (kind VIDEO, lifecycle FINALISE)

REVIEW
  aperçu proxy d'abord → rendu complet à l'approbation
  Valider / Modifier / Rejeter
  retouches (in/out, texte sous-titre, hook, cadrage, format) → re-rendu **ciblé** (seul le segment affecté)

PUBLISH
  → chaîne Publication / PublicationTarget existante : légende par réseau, hashtags, date, programmation
```

### DAG de jobs (BullMQ)

| Job | In | Out | Idempotence | Retry |
|---|---|---|---|---|
| `video.ingest` | upload terminé | proxy + probe | `mediaAssetId + checksum` | 2 |
| `video.transcribe` | proxy prêt | Transcript (mots) | `mediaAssetId + checksum` | 2 |
| `video.analyze.signal` | proxy prêt | shots / silences / energy | `videoProjectId + analysisVersion` | 2 |
| `video.analyze.diarize` | proxy prêt | speakers[] | idem | 2 |
| `video.select` | transcribe + analyze finis (**join**) | VideoClip[] + hooks | `videoProjectId + analysisVersion` | 2 |
| `video.render` | clip sélectionné | RenderJob → outputMediaId | `renderJobId` ; rendu partiel supprimé | 2 |
| `video.formatcheck` | rendu prêt | FormatCheck (PASS/WARN/FAIL) | `renderJobId + network` | 1 |

`video.analyze.*` et `video.transcribe` partent en parallèle après `video.ingest`. `video.select`
attend le join. `video.render` fan-out uniquement sur les clips **sélectionnés** et les
**formats demandés**.

---

## 4. Modèle de données

Étend le §4.3 du cahier des charges. Toutes les tables : `tenantId` non nullable + RLS,
conventions Agency Hub (`createdAt/updatedAt`, `@@map` snake_case).

### 4.1 Entités étendues

| Entité | Champs ajoutés | Raison |
|---|---|---|
| `VideoProject` | `proxyMediaId`, `sourceDurationMs`, `sourceWidth/Height/Fps`, `analysisVersion` (int), `stageStatus Json` (`{ingest,transcribe,analyze,select}` chacun `PENDING/RUNNING/DONE/FAILED`), `lang`, `style` (Clean/Dynamic/Podcast/Artiste/Business), `costCents` | Statut **par étape**, pas un seul enum ; suivi coût |
| `TranscriptSegment` | `words Json` (`[{ text, startMs, endMs, confidence }]`) | Karaoké mot-à-mot + coupes propres (ne jamais couper au milieu d'un mot) |
| `VideoClip` | `scoreBreakdown Json` (`{hook,autonomy,clarity,pace,emotion,lengthFit}`), `hookVariants Json` (`[{label:'A',text}, …]`), `topicLabel`, `editDecisionList Json` (plages gardées après retrait des silences), `parentClipId` (nullable, variantes), `sourceRangeMs Json` (`{start,end}` dans la source) | Score détaillé, variantes, EDL |
| `RenderJob` | `variantLabel` ('A'/'B'/'C'/null), `aspect` (`9:16`/`4:5`/`1:1`/`16:9`/`ORIGINAL`), `cropPath Json?` (trajectoire de recadrage), `zoomEvents Json?`, `captionStyleId` (→ `SubtitleTemplate`), `previewMediaId`, `outputMediaId`, `costCents`, `engineVersion` | Un rendu = 1 clip × 1 format × 1 variante |

### 4.2 Nouvelles entités

| Entité | Rôle | Champs clés |
|---|---|---|
| `AnalysisFeature` | Résultat brut d'analyse signal d'un projet (1 ligne / type) | `videoProjectId`, `kind` (SHOTS/SILENCES/SPEAKERS/ENERGY/TOPICS), `data Json`, `analysisVersion`, `computedAt` |
| `ClipFeedback` | Retour analytics vers la sélection | `videoClipId`, `publicationTargetId`, `metricSnapshot Json` (views/watchTime/engagement à J+7), `performedWell Bool?` (calculé vs médiane du client) |

### 4.3 Réutilisées telles quelles

`Transcript`, `SubtitleTemplate`, `FormatCheck`, `MediaAsset` (+ `lifecycle`), `MediaFolder`,
`ContentMetric` (rétro-lié via `ClipFeedback`), `AutomationRule` (trigger `VIDEO_RENDERED`).

### 4.4 Boucle fermée (analytics → sélection)

`ContentMetric` d'un post publié → `ClipFeedback` sur le `VideoClip` d'origine → agrégat par
client (durées, hooks, sujets qui performent) → injecté dans le prompt de `video.select` via
`Company.aiContext`. V1 : collecte seulement. V2 : calibrage effectif du score.

---

## 5. Infra à ajouter

| Élément | Détail |
|---|---|
| `worker-video-gpu` | ASR + CV (diarisation, active-speaker, visage). File autoscalée, scale-to-zero hors charge. |
| `worker-video-cpu` | ffmpeg : proxy, découpe, retrait silences, incrustation sous-titres, loudnorm. |
| Upload résumable | protocole **tus** — fichiers 60 min / plusieurs Go. |
| Stockage étagé | brut (froid après 30 j), proxy (chaud), rendus (chaud → froid après 30 j), miniatures (chaud). Chemins `tenant_id/client_id/project_id/…`, URLs signées. |
| Garde-fous coût | quota **minutes-source** par tenant (`PlanQuota` metric `VIDEO_SOURCE_MINUTES`) ; dedup par `checksum` ; « analyser à la demande » ; kill des jobs > seuil ; rendu limité aux clips sélectionnés × formats demandés. |
| Cache | `checksum` de la source → réutilise transcription + features si ré-import. |

### Ordre de grandeur — source 60 min

- ASR : quelques minutes-GPU self-host, ou ~0,30–0,40 € en API.
- Analyse CV (signal + diarisation + active-speaker) : quelques minutes-GPU.
- Sélection LLM : un appel long-contexte, ~0,05–0,20 €.
- Rendus : 12 clips × 4 formats × 3 variantes = **144 rendus** → minutes-CPU (peu cher) + **egress à la livraison**.

Parades rendu : les variantes partagent la coupe de base et ne re-rendent que les ~2 premières
secondes (hook) ; proxy-preview avant rendu complet ; formats générés à la demande.

---

## 6. Les parties dures, classées

1. **Recadrage / suivi du locuteur actif « intentionnel »** — le plus dur. C'est là que les
   outils cheap échouent (crop qui saute). MediaPipe + LightASD/TalkNet + lissage temporel.
   Fallback V1 assumé : center-crop + visage simple.
2. **Qualité de sélection des clips** — « ces 45 s tiennent-elles seules et accrochent-elles
   en 2 s ? ». LLM = « correct » ; exige de bonnes features + itération de prompt + la boucle
   de feedback (§4.4).
3. **Retrait des silences sans hachage** — crossfades, garder la respiration, jamais au milieu
   d'un mot (timestamps au mot).
4. **Rendu sous-titres à l'échelle** avec styles par client + mot-à-mot — `libass` fait le
   travail ; l'éditeur ligne-à-ligne est fastidieux.
5. **Coût / latence de rendu** — voir §5.

---

## 7. Phasage — Studio-first

### V1 — le produit qui vend

- Upload + proxy + probe.
- ASR au mot (FR).
- Retrait silences + tics.
- Sélection LLM : 8–15 clips, `scoreBreakdown`, **1 hook** par clip.
- Rendu **9:16 seul**.
- **Un** style de sous-titres (mot-à-mot, `SubtitleTemplate` client).
- Recadrage **center-crop + détection visage simple** (pas de tracking actif).
- Aperçu + retouche in/out.
- Bouton « Envoyer vers publication » → chaîne existante.

### V1.5

- Recadrage locuteur actif (tracking + Kalman).
- 3 styles de sous-titres (Simple / Dynamique / Mot-à-mot).
- 4 formats (9:16, 4:5, 1:1, 16:9) + Original.
- Variantes de hook A/B/C.
- Éditeur de sous-titres ligne-à-ligne + segments faible confiance surlignés.
- `FormatCheck` par réseau avant publication.

### V2

- Zoom / punch-in dynamiques (`zoomEvents`).
- Coupes multi-locuteurs (diarisation → cuts).
- **Score calibré sur analytics réels** (`ClipFeedback` actif — boucle fermée).
- Pistes multilingues (PT / créole), une piste sous-titres par langue.
- Presets « style client » enregistrables.
- Automatisation `VIDEO_RENDERED` → crée targets IG/TikTok/FB + légende + hashtags + créneau.

### V3

- Insertion b-roll / images par mot-clé.
- Lit musical automatique.
- Templates verrouillés marque (police / couleurs imposées).

---

## 8. Risques & décisions ouvertes

| Sujet | Risque | Piste |
|---|---|---|
| Recadrage active-speaker | Build interne coûteux ; qualité « saute » si bâclé | V1 center-crop assumé ; V1.5 OSS (LightASD) ; évaluer une API dédiée avant de sur-investir |
| Cible mouvante vs incumbents | Opus Clip & co. avancent vite sur la qualité montage | Ne pas rivaliser sur le montage ; vendre l'**intégration agence** (§1) |
| Coût GPU autoscale | Idle coûteux, pics de charge | Scale-to-zero, file dédiée, quota minutes-source par tenant |
| Volumétrie stockage | Bruts 4K + 144 rendus / source | Rétention bruts 30 j, transcodage proxy, archivage froid des rendus |
| Latence perçue | 60 min → « prêt » peut prendre 10–20 min | Progression WebSocket par étape ; transcription + 1er clip d'abord, reste en fond |
| Qualité ASR créole | Variable | Relecture humaine obligatoire, glossaire par client |
| Coupe sur keyframes | Découpe imprécise si GOP long | Proxy ré-encodé all-I ou `-c copy` + `-ss` sur keyframe la plus proche puis trim précis au rendu |

---

## 9. Prochaines étapes concrètes

1. Poser les migrations Prisma : `VideoProject` (champs étape), `TranscriptSegment.words`,
   `VideoClip` (score/variantes/EDL), `RenderJob` (aspect/variante/crop), `AnalysisFeature`,
   `ClipFeedback` + policies RLS (motif `subcontractors_rls`).
2. Monter `worker-video-gpu` / `worker-video-cpu` + les 7 jobs du §3 (BullMQ).
3. Tranche verticale V1 sur **une vraie vidéo d'un client pilote** :
   upload → proxy → ASR → silences → `video.select` → aperçu → rendu 9:16 → médiathèque → publication.
4. Prompt `video.select` : itérer sur 10 vidéos réelles, mesurer la pertinence des clips à la main.
5. Décider build vs API pour le recadrage actif **après** avoir mesuré la qualité center-crop en V1.

---

## Journal d'implémentation

| Date | Incrément | Contenu |
|---|---|---|
| 2026-09-08 | Cadrage | Ce document. Studio Vidéo IA posé comme cœur du produit ; pipeline, DAG de jobs, modèle de données, phasage Studio-first. |
