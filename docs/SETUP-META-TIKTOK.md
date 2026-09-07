# Configuration des apps Meta &amp; TikTok — pas à pas

But : obtenir les identifiants d'application pour publier sur Instagram / Facebook et
TikTok au nom de comptes clients. Voir aussi `CAHIER-DES-CHARGES-RESEAUX.md` §8.

> Les noms de boutons/menus peuvent varier légèrement selon les mises à jour des
> consoles. La logique reste la même : app → produits → permissions/scopes → tokens.

**Ordre recommandé**
1. Meta — vérification business (§A) : à lancer **en premier**, délai long.
2. Meta — créer l'app (§B–D) et TikTok — créer l'app (§E–H), en parallèle.
3. Soumettre les revues (§ App Review / Submit for review) — sans attendre pour coder
   le flux OAuth contre le mode dev / sandbox.

---

## A. Meta — portefeuille Business + vérification

1. Aller sur **business.facebook.com**, se connecter avec le **compte Facebook personnel**
   de la personne qui administre (Meta n'a pas de compte « entreprise » autonome).
2. S'il n'existe pas encore : **Créer un portefeuille** → nom légal de l'agence, ton nom,
   email professionnel → **Créer**.
3. Icône engrenage (**Paramètres de l'entreprise**) → **Infos sur l'entreprise** :
   remplir nom légal, adresse, téléphone, site web.
4. **Centre de sécurité** → **Vérification de l'entreprise** → **Commencer** :
   - pays,
   - détails légaux **exactement** comme sur le document officiel,
   - téléverser un justificatif (extrait de registre / Kbis, + justificatif d'adresse).
5. Statut → **En attente** (quelques jours à ~2 semaines). On continue sans attendre.

---

## B. Meta — créer l'app

1. **developers.facebook.com** → se connecter → en haut à droite **My Apps** →
   **Create App**.
2. **App name** : `Iniciativas Media Publisher` · **App contact email** → **Next**.
3. **Use cases** : choisir **Other** → **Next**.
4. **Type** : **Business** → **Next** → sélectionner le portefeuille Business (§A) →
   **Create app** (ressaisir le mot de passe Facebook).
5. Sur le dashboard : menu gauche → **App settings → Basic**
   - **App ID** et **App secret** (bouton *Show*) → à garder.
   - **Privacy Policy URL** (obligatoire) : une page simple suffit
     (ex. `https://iniciativasmedia.com/confidentialite`).
   - **App domains** : ton domaine + (plus tard) le domaine du tunnel de dev.
   - **Category** : *Business and pages*.
   - **Save changes**.

---

## C. Meta — ajouter les produits

Menu gauche → **Add product** (ou le « + » à côté de *Products*).

### Facebook Login for Business → *Set up*
1. Menu gauche → **Facebook Login for Business → Settings**
   - *Client OAuth login* : **Yes**
   - *Web OAuth login* : **Yes**
   - *Valid OAuth Redirect URIs* : `https://<tunnel>/social/meta/callback`
     (peut rester vide pour l'instant, à remplir dès que le tunnel tourne)
   - **Save changes**
2. Onglet **Configurations → Create configuration**
   - Nom : `Publisher`
   - *Login variation* : **Business login**
   - **Permissions** à cocher :
     `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`,
     `business_management`, `instagram_basic`, `instagram_content_publish`
     (+ `instagram_manage_insights` si tu veux les stats)
   - **Create** → copier le **Configuration ID** → `META_CONFIG_ID`.

### Instagram → *Set up*
- Choisir la section **« Instagram API with Facebook Login »** (API setup with
  Facebook login). Rien d'autre à configurer ici pour l'instant.

### Webhooks → *Set up* (optionnel, plus tard)
- Objets `instagram` et `page` · Callback `https://<tunnel>/social/meta/webhook`
  · *Verify token* = valeur de `META_WEBHOOK_VERIFY_TOKEN`.

---

## D. Meta — tester en mode Développement (sans App Review)

- L'app reste en **Development** (bascule près du nom de l'app). En dev, seuls les
  comptes ayant un rôle sur l'app peuvent l'utiliser.
- Menu gauche → **App roles → Roles** → t'ajouter (déjà admin) ou ajouter des testeurs.
- **Ton propre** compte Instagram **professionnel** rattaché à **ta propre** Page
  Facebook fonctionne dès maintenant — pas besoin d'App Review.

### App Review → Live (quand le tunnel + un screencast sont prêts)
- Menu gauche → **App Review → Permissions and features** → *Request advanced access*
  pour chaque permission → joindre notes + **capture vidéo du flux OAuth complet** →
  **Submit**.
- Passer l'app en **Live**.

### Pré-requis côté client (onboarding)
Compte Instagram **Professionnel** (Business ou Creator) **rattaché à une Page
Facebook** dont le client est admin. Le client passe par le flux OAuth et accorde
l'accès.

---

## E. TikTok — créer l'app

1. **developers.tiktok.com** → **Log in** (en haut à droite) → se connecter avec le
   **compte TikTok de l'agence** (QR via l'app TikTok, ou email) → accepter les
   *Developer Terms*.
2. Avatar en haut à droite → **Manage apps** → **Connect an app** / **Create an app**.
3. Formulaire *App info* :
   - **App name**, **App icon** (PNG 1024×1024), **Category**
   - **Description** (quelques phrases sur l'usage)
   - **Terms of Service URL** + **Privacy Policy URL** (les deux obligatoires)
   - **Website URL**
   - **Platforms** → cocher **Web** → renseigner l'URL du site
   - Enregistrer.

---

## F. TikTok — ajouter les produits

Sur la page de l'app → **Add products**.

### Login Kit
- **Redirect URI** : `https://<tunnel>/social/tiktok/callback` (exact)
- Platform : **Web**

### Content Posting API
- Choisir le mode :
  - **Direct Post** (publie directement) → **nécessite l'audit**.
  - **Upload** (dépose dans la boîte de réception / brouillons TikTok, le client
    finalise dans l'app) → disponible plus vite, sans audit pour démarrer.
- Si **Direct Post via `PULL_FROM_URL`** : section **URL properties** → ajouter le
  domaine qui hébergera les vidéos (ton bucket S3/R2 exposé) et **vérifier** la
  propriété (fichier de signature ou DNS TXT). Sinon, utiliser **`FILE_UPLOAD`**
  (envoi direct des octets) — pas de vérification de domaine.

### Scopes à demander
`user.info.basic`, `video.upload`, `video.publish`, `photo.publish`
(chaque scope est validé à la revue).

---

## G. TikTok — sandbox (test avant audit)

- Sur la page de l'app → section **Sandbox** → créer un sandbox → ajouter **ton
  compte TikTok** comme *target user*.
- En sandbox / non audité, les posts sont forcés en `SELF_ONLY` (privés) — suffisant
  pour valider tout le flux OAuth + upload.

### Submit for review → production
- **Submit for review** : formulaire d'usage + **démo vidéo du flux complet**.
- Après approbation : publication directe + posts publics possibles.

### Contraintes UX imposées (à intégrer dans l'UI, cf. §7 du cahier des charges)
Écran de **confirmation obligatoire** avant envoi · mention « publié via Iniciativas
Media » · gestion du *Commercial Content toggle* (divulgation contenu commercial /
branded).

---

## H. TikTok — identifiants

Page de l'app → **Basic information** → copier **Client key** et **Client secret**.

---

## I. Où mettre les identifiants

Dans `apps/api/.env` (jamais commité — `.env.example` sert de gabarit) :

```
META_APP_ID=...
META_APP_SECRET=...
META_CONFIG_ID=...
META_GRAPH_VERSION=v21.0
META_REDIRECT_URI=https://<tunnel>/social/meta/callback
META_WEBHOOK_VERIFY_TOKEN=<chaîne aléatoire de ton choix>

TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
TIKTOK_REDIRECT_URI=https://<tunnel>/social/tiktok/callback
```

Les tokens **par compte client** (access/refresh) ne vont pas ici : ils sont stockés
chiffrés dans la table `social_accounts`.

---

## J. Tunnel HTTPS pour le développement

Meta et TikTok exigent des redirect URIs en **HTTPS public**. En local :

```
cloudflared tunnel --url http://localhost:3000
```

(ou `ngrok http 3000`) → donne une URL `https://xxxx.trycloudflare.com`. Utiliser
cette URL comme `<tunnel>` :
1. dans `apps/api/.env` (`*_REDIRECT_URI`),
2. **et** dans les consoles Meta (Valid OAuth Redirect URIs) et TikTok (Redirect URI)
   — elles doivent correspondre **exactement**.

L'URL change à chaque lancement de `cloudflared` en mode éphémère ; pour une URL
stable, configurer un *named tunnel* Cloudflare.

---

## K. Correspondance avec le code

| État plateforme | `SocialAccountCapability` |
|---|---|
| Meta en dev / App Review pas encore Live | `MANUAL` ou `UNVERIFIED` |
| Meta Live + token valide | `AUTO_PUBLISH` |
| TikTok mode Upload / non audité | `DRAFT_ONLY` |
| TikTok Direct Post approuvé | `AUTO_PUBLISH` |
| Token invalide / révoqué | `EXPIRED` |

Une fois `META_APP_ID` / `META_APP_SECRET` / `TIKTOK_CLIENT_KEY` /
`TIKTOK_CLIENT_SECRET` disponibles, l'increment suivant code le flux OAuth
(`GET /social/meta/connect` + `/callback`, idem TikTok) et les adaptateurs réels,
testables contre le mode dev Meta et le sandbox TikTok.
