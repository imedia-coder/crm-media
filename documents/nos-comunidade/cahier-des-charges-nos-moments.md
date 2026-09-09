# Nôs Comunidade — Cahier des charges NÔS MOMENTS (reçu, pas encore implémenté)

*Cahier des charges technique fourni par le porteur de projet le 16/08/2026, pour une fonctionnalité de type "stories éphémères 24h" (à la BeReal/Instagram Stories). Reproduit ci-dessous pour référence future.*

## Décision du 16/08/2026 (mise à jour le 16/08/2026, plus tard le même jour)

Première décision : ne pas implémenter ce cahier des charges tout de suite, et livrer à la place une version très réduite (grille de photos façon Instagram sur le profil — commit `b5ac87e`).

**Le porteur de projet est revenu dessus le jour même** et a demandé explicitement la barre de stories façon Instagram sur l'écran principal. Une **version MVP de NÔS MOMENTS a donc été livrée** (commit `187d969`) : photo uniquement (pas de vidéo), expiration 24h gérée côté backend par filtrage à la requête (`expiresAt > now`, pas de tâche cron séparée), visionneur plein écran avec navigation verticale entre tous les Moments actifs, like, suppression par l'auteur, île/localisation optionnelles à la publication (auto-remplies depuis le profil, désactivables).

**Mise à jour du 16/08/2026 (suite)** : la messagerie a été construite (conversations 1-à-1), donc les réponses aux Moments arrivent bien dans Messages comme prévu section 20. Le signalement de Moment (section 27) et le filtre par île (section 22, sans les compteurs par île en direct) sont également livrés.

**Ce qui reste volontairement hors de ce MVP** (voir le README de `nos-comunidade` pour le détail à jour) :
- Vidéo (pas d'upload vidéo nulle part dans l'app pour l'instant)
- Réglages de confidentialité par Moment (Tout le monde/Ma communauté/Abonnés/Amis proches — toujours visible à toute la communauté pour l'instant)
- Vues/statistiques par Moment, dashboard admin
- Mentions, recadrage, filtres
- Compteurs de Moments par île en direct sur la page Communauté (section 22) — la page île montre les Moments actifs, mais pas encore "124 Moments aujourd'hui" par île
- Carte de la diaspora avec Moments (section 23)

Le texte intégral ci-dessous reste la référence complète pour ces items, à reprendre quand ils deviendront prioritaires.

---

## Texte intégral du cahier des charges

### 1. Objectif

Ajouter **NÔS MOMENTS** : les utilisateurs partagent une photo ou courte vidéo de leur moment actuel, visible 24h puis disparaissant automatiquement. Pas une copie d'Instagram/BeReal — une expérience propre à Nôs Comunidade : « Voir ce que fait notre communauté aujourd'hui. »

### 2. Positionnement

Spontané, authentique, temporaire, communautaire, simple, rapide.

### 3. Emplacement dans l'application

Recommandation : ne pas surcharger la navigation à 6 éléments. Garder `Accueil | Découvrir | Créer | Messages | Profil` et rendre NÔS MOMENTS accessible via un bandeau dédié en haut de l'accueil.

### 4. Écran NÔS MOMENTS

Titre + sous-titre "Ce qui se passe aujourd'hui dans notre communauté." Section "Votre Moment" (bouton "Partager mon Moment" ou indicateur "Disponible encore 17h42" si déjà publié).

### 5-7. Création et édition

Photo (appareil ou galerie) ou vidéo (30s max recommandé, MP4/MOV, compression automatique). Options d'édition simples : Texte, Recadrage, Son, Mentionner une personne, Localisation, Île. Pas de multitude de filtres — rester simple et authentique.

### 8. Identification de l'île

Fonctionnalité importante : associer le Moment à une île (ou reprendre celle du profil), affichage type "Santiago · Paris", permet de filtrer les Moments par île.

### 9. Localisation

Optionnelle, jamais obligatoire (ville+pays, ou juste pays).

### 10-11. Confidentialité et publication

Choix de visibilité avant publication : Tout le monde / Ma communauté (défaut) / Mes abonnés / Amis proches / Personne (brouillon). Bouton "Publier", affichage du temps restant après publication.

### 12-14. Durée de vie, suppression, archivage

`created_at` / `expires_at` (= created_at + 24h). Le **backend** doit gérer l'expiration (pas juste masquer côté client) — champ `status = expired`. Archive privée facultative après expiration (date, photo/vidéo, île, ville) — **privée par défaut**.

### 15. Écran de découverte

4 catégories : Pour vous (intérêts), Près de vous (ville/pays), Mes îles, Diaspora (toute la communauté).

### 16-18. Affichage et visionnage

Carte Moment : photo, nom, ville, île, texte, temps restant, actions (J'aime/Répondre/Partager). Visionnage plein écran avec navigation verticale entre Moments successifs.

### 19-21. Réactions, réponses, notifications

Réactions sobres (J'aime/Répondre/Partager). Les réponses arrivent dans la Messagerie (qui n'existe pas encore dans l'app — dépendance à construire). Notifications uniquement pertinentes (réponse reçue, nouvelle réaction, expiration proche) — pas de notifications artificielles.

### 22-23. Intégration îles et diaspora

Compteurs de Moments par île (ex. "Santiago — 124 Moments aujourd'hui") et par ville de la diaspora (Paris, Lisbonne, Rotterdam, Boston, Praia) — sélection pour filtrer.

### 24-25. Algorithme et découverte de nouveaux créateurs

Score = affinité utilisateur + îles/ville communes + centres d'intérêt + personnes suivies + fraîcheur (forte importance) + interactions. Ne pas favoriser uniquement les comptes populaires — un compte à 20 abonnés doit pouvoir être découvert.

### 26-27. Anti-spam et modération

Bloquer publications automatisées, spam, répétition excessive, faux comptes, manipulation de réactions. Limiter le nombre de Moments publiables sur une période si nécessaire. Signalement par Moment (mêmes motifs que le reste de l'app + "Fausse information").

### 28-32. Base de données et API (schéma proposé)

```
moments: id, user_id, media_url, media_type, caption, island_id, country, city,
         visibility, created_at, expires_at, status, view_count, like_count,
         reply_count, share_count
moment_reactions: id, moment_id, user_id, reaction_type, created_at (unique par user+moment)
moment_views: id, moment_id, user_id, created_at (dédupliquer par session/délai)
```

Endpoints proposés : `POST/GET /moments`, `GET/DELETE /moments/:id`, `POST /moments/:id/{reaction,view,reply,report}`, `GET /moments/island/:islandId`, `GET /moments/location/:locationId`.

Tâche périodique (toutes les 5 min) : marquer `status = expired` pour `expires_at < NOW()` ; les contenus expirés ne doivent plus être servis par les endpoints publics.

### 33-34. Stockage et performance

Compression, miniatures, CDN. Premier Moment doit charger vite (chargement progressif, lazy loading, préchargement du Moment suivant), fluide même en connexion mobile moyenne.

### 35. Statistiques administrateur

Dashboard : Moments publiés aujourd'hui, utilisateurs ayant publié, vues/réactions/réponses/partages, Moments expirés, utilisateurs actifs, top villes, top îles.

### 36. Design

Respecter la refonte déjà en place (palette inchangée, pas d'emojis système, icônes SVG, typographie moderne, cartes propres, animations légères). Identité légèrement différente du feed classique tout en restant cohérent.

### 38. Règle produit

« Moins de perfection. Plus de présence. » — ne pas pousser à produire du contenu parfait ; la valeur vient de montrer ce qui se passe maintenant.

### 39. Phases de développement proposées

- **Phase 1 (MVP)** : création photo/vidéo, publication, expiration 24h, affichage, suppression/masquage auto, réactions, réponses, signalement.
- **Phase 2** : sélection des îles, localisation, filtres ville/île, recommandations personnalisées.
- **Phase 3** : archive privée, statistiques, découverte de nouveaux talents, carte de la diaspora.
- **Phase 4** : Moments par événement, Moments d'artistes/d'entreprises, fonctionnalités premium.

### 40. Critères de validation

Créer/publier photo ou vidéo, visible immédiatement, durée de vie exactement 24h, disparition des flux publics à expiration (côté backend, pas juste UI), temps restant visible, réactions/réponses/signalements fonctionnels, île associable, localisation facultative, permissions de confidentialité respectées, performance fluide mobile, API publique ne sert plus le contenu expiré.
