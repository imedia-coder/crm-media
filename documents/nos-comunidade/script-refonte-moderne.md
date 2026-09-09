# Nôs Comunidade — Script de refonte moderne

*Cahier des charges fourni par le porteur de projet le 16/08/2026, 39 sections. Reproduit intégralement ci-dessous pour référence future. Voir [algorithme-roadmap-v2.md](algorithme-roadmap-v2.md) pour le suivi des Phases 1-2 (feed, événements) et l'état d'avancement des priorités de ce document.*

## Suivi des priorités

| # | Priorité | Statut |
|---|---|---|
| 1 | Refonte visuelle | ✅ livrée le 16/08/2026 (typographie Inter, suppression des emojis système, transitions douces — palette inchangée) |
| 2 | Nouvel onboarding | ✅ livré le 16/08/2026 : après création du profil, enchaînement îles → intérêts → profils suggérés → écran de fin |
| 3 | Carte interactive des 10 îles | ✅ livrée le 16/08/2026, **améliorée le 17/08/2026** — chaque île utilise désormais son **vrai contour côtier** (données publiques, Wikimedia Commons), pas une forme générique. Positions calées sur la géographie réelle. Multi-sélection animée. |
| 4 | Sélection des îles dans le profil | ✅ livré le 16/08/2026 — `User.islands` (migration), chips « Mes îles » affichées sur le profil consulté |
| 5 | Personnalisation du feed (îles/ville/pays/intérêts) | ✅ livré le 16/08/2026 — score d'affinité (personnes suivies +15, île commune +10/île, ville commune +8, pays commun +3, intérêt commun +4/intérêt) ajouté à `GET /api/posts/feed`. Volontairement absent de `/api/posts/discover` pour ne pas enfermer l'utilisateur dans une bulle sur cet onglet. |
| 6 | Page « Mes îles » | ✅ livré le 16/08/2026 — chips du profil cliquables vers la page dédiée de chaque île |
| 7 | Pages communautaires des 10 îles | ✅ livré le 16/08/2026 — écran Communauté avec bascule Villes/Îles ; page par île (stats, membres, publications récentes). Pas encore de section Événements par île (les événements n'ont pas de champ île en base). |
| 8 | Découverte des talents | ⏳ à faire |
| 9 | Événements | ✅ livré le 16/08/2026 (Phase 2, sans le filtre par île — voir algorithme-roadmap-v2.md) |
| 10 | Opportunités | ⏳ à faire |

**Note sur la carte des 10 îles (mise à jour 17/08/2026)** : après retour du porteur de projet demandant des îles réalistes (référence : carte illustrée avec bannières + vraie carte géographique de l'archipel), les contours schématiques initiaux ont été remplacés par les **vrais contours côtiers** de chaque île. Source : la carte de localisation du Cap-Vert publiée sur Wikimedia Commons (`Cape Verde location map.svg`, catégorie des cartes de repérage Wikipédia — données géographiques publiques, réutilisation prévue pour ce type d'usage). Les 10 contours ont été extraits, identifiés par position/taille puis stockés dans `lib/models/island_shapes.dart` (chemins SVG), rendus via le package `path_drawing`. Les proportions largeur/hauteur réelles de chaque île sont respectées.

**Règle absolue rappelée** : la palette de couleurs actuelle (bleu/turquoise, rose, violet, jaune/or, blanc, gris clair) ne doit jamais être modifiée par les priorités suivantes.

---

## Texte intégral du script

### 1. Objectif

Refondre l'interface actuelle de Nôs Comunidade afin d'obtenir une application moderne, professionnelle, premium, simple, élégante, rapide à comprendre, adaptée à une utilisation internationale, fortement identifiable comme une application dédiée à la communauté capverdienne.

**Règle absolue** : ne pas changer la palette de couleurs actuelle. La modernisation doit venir de la typographie, des espacements, des proportions, des icônes, des cartes, des animations, de la hiérarchie visuelle, de la navigation, et de la carte interactive des 10 îles.

### 2. Palette de couleurs

- **Bleu / Turquoise** — couleur principale : logo, boutons principaux, navigation active, éléments sélectionnés, liens importants, éléments interactifs.
- **Rose** — catégorie Musique, interactions sociales, certains éléments de mise en avant.
- **Violet** — Artistes, Créateurs, Culture.
- **Jaune / Or** (usage limité) — Talent de la semaine, contenu mis en avant, récompenses, fonctionnalités premium.
- **Blanc** — couleur principale des cartes et surfaces.
- **Gris très clair** — arrière-plans, zones secondaires, séparations.

### 3. Règle d'utilisation des couleurs

70 à 80 % de surfaces neutres, 20 à 30 % de couleurs de marque. Éviter les écrans entièrement colorés et les gros gradients partout. Le gradient bleu/turquoise reste possible pour : bouton principal, header, éléments premium, identité visuelle.

### 4. Suppression des emojis de l'interface

Supprimer les emojis de toute l'interface système (ex. « 🎵 Musique » → icône SVG + « Musique »). Les utilisateurs peuvent toujours utiliser des emojis dans leurs propres publications et messages.

### 5. Typographie

Priorité **Inter**, alternative **Manrope**. Claire, moderne, lisible, légèrement arrondie, professionnelle.

- Titre principal : 24-32px
- Titre secondaire : 18-22px
- Texte : 14-16px
- Texte secondaire : 12-14px
- Boutons : 14-16px, semi-bold

### 6. Style global

Beaucoup d'espace blanc, cartes propres, bordures très fines, ombres légères, coins arrondis modérés, hiérarchie claire. Éviter : grosses ombres, effets 3D, animations excessives, trop de couleurs, éléments trop rapprochés.

### 7. Écran de bienvenue

Logo « Nôs Comunidade », sous-titre « 10 îles. Une communauté. Un monde. », affichage progressif de la carte des 10 îles. Bouton principal « Créer mon compte », bouton secondaire « Se connecter ».

### 8. Inscription — étape 1

« Bienvenue dans Nôs Comunidade » / « Commençons par ce qui nous rassemble. » puis « Quelles îles font partie de votre histoire ? » / « Sélectionnez une ou plusieurs îles. » avec la carte interactive du Cap-Vert.

### 9. Carte interactive des 10 îles

Référence : la carte actuellement préférée par le propriétaire du projet, modernisée sans perdre son identité. Les 10 îles doivent être clairement identifiables : Santo Antão, São Vicente, Santa Luzia, São Nicolau, Sal, Boa Vista, Maio, Santiago, Fogo, Brava. Chaque île est interactive.

### 10. État des îles

- **Normal** : couleur normale de la carte.
- **Sélectionné** : couleur accentuée, contour blanc, légère animation, nom clairement visible.
- **Survol/toucher** : animation très légère. Pas d'emoji.

### 11. Sélection multiple

Plusieurs îles sélectionnables (ex. Santiago, Fogo, São Vicente). En bas : « 3 îles sélectionnées », bouton « Continuer ».

### 12. Informations sur une île

Petite carte d'info à la sélection, ex. « Santiago — Praia · Assomada · Tarrafal — Sélectionner cette île ». Reste très simple.

### 13. Étape 2 — Localisation

« Où vivez-vous aujourd'hui ? » Sélection du pays (France, Portugal, Pays-Bas, Luxembourg, Italie, États-Unis, Cap-Vert, Autre), puis « Votre ville » (ex. Paris).

### 14. Étape 3 — Centres d'intérêt

« Qu'aimeriez-vous découvrir ? » — jusqu'à 5 catégories parmi : Musique, Artistes, Créateurs, Culture, Sport, Entrepreneuriat, Événements, Gastronomie, Actualités, Diaspora. Couleurs actuelles pour différencier. Aucun emoji.

### 15. Étape 4 — Personnes à suivre

« Découvrez votre communauté » — 5 à 10 profils pertinents (photo, nom, activité, ville, île(s), bouton Suivre), sélectionnés selon îles choisies, ville, pays, centres d'intérêt, popularité, nouveaux talents.

### 16. Fin de l'inscription

« Votre communauté est prête. » Résumé (îles, ville, intérêts). Bouton « Découvrir Nôs Comunidade ».

### 17. Écran d'accueil

Header « Nôs Comunidade », section « Pour vous », navigation secondaire : Pour vous | Suivis | Découvrir | Communauté.

### 18. Catégories

Affichage horizontal : Musique (rose), Artistes (violet), Créateurs (bleu), Diaspora (turquoise), Talents (jaune). Boutons sobres, couleurs actuelles.

### 19. Fil d'actualité

Structure par publication : en-tête (photo, nom, ville, île(s)), contenu (photo/vidéo, description), actions (J'aime, Commenter, Partager, Enregistrer). Icônes simples et modernes.

### 20. Informations de localisation

Affichage discret type « Paris, France — Santiago » ou « Rotterdam, Pays-Bas — São Vicente ».

### 21. Espace « Mes îles »

Section profil listant les îles sélectionnées (ex. Santiago, Fogo, São Vicente), chacune ouvrable.

### 22. Page d'une île

Ex. Santiago : Communauté (Membres, Artistes, Créateurs, Événements, Publications), puis « À découvrir » (Talents de Santiago, Événements, Publications récentes, Membres de la diaspora).

### 23. Carte « Talent de la semaine »

Grande carte premium : photo/vidéo, nom, activité, ville, île, description, boutons Découvrir/Suivre. Jaune/or utilisé avec parcimonie.

### 24. Page Découvrir

Quatre blocs : Tendances, Nouveaux talents, Près de vous, Diaspora.

### 25. Page Communauté

Différenciateur clé vs autres réseaux sociaux : « Votre communauté » — Dans votre ville, Dans votre pays, Vos îles, Dans la diaspora.

### 26. Carte de la diaspora (fonctionnalité future)

Carte mondiale (Paris, Lisbonne, Rotterdam, Boston, Praia...). Sélection d'une ville → membres, artistes, entrepreneurs, événements, associations, publications.

### 27. Événements

Page « Événements » avec filtres (Aujourd'hui, Cette semaine, Ce mois-ci, Près de moi, Mon île) et catégories (Musique, Culture, Sport, Business, Communauté). Chaque événement : nom, date, lieu, organisateur, image, bouton « Voir l'événement ».

### 28. Opportunités

Catégories : Emploi, Business, Collaboration, Musique, Création, Événementiel. Chaque annonce : titre, auteur, ville, île, description courte, bouton « Découvrir ».

### 29. Profil

Très professionnel : nom, activité, ville/pays, îles, abonnés/abonnements, boutons Suivre/Message, puis Publications/Vidéos/Événements/À propos.

### 30. Navigation principale

5 éléments : Accueil, Découvrir, Créer, Messages, Profil. Icônes SVG, élément actif en bleu/turquoise.

### 31. Bouton de création

Bleu/turquoise, bien identifiable. Permet : Publication, Photo, Vidéo, Événement, Opportunité.

### 32. Animations

Discrètes : transitions 150-300ms, apparition douce des cartes, sélection animée des îles, transition fluide entre pages, animation légère à la sélection d'une catégorie. Éviter les animations permanentes.

### 33. Responsive

Petits/grands smartphones, tablettes, ordinateur, navigateur web. La carte des 10 îles doit rester lisible sur toutes les tailles.

### 34. Mode sombre

Prévoir l'architecture (clair/sombre) sans modifier la palette de marque, reconnaissable dans les deux modes.

### 35. Accessibilité

Contraste suffisant, texte lisible, boutons assez grands, zones tactiles confortables, support lecteurs d'écran, navigation claire.

### 36. Règle pour le designer

« Nous modernisons l'application sans supprimer son identité. » Ne pas changer les couleurs, ne pas transformer l'app en interface noire/blanche générique, ne pas utiliser d'emojis pour construire l'identité. L'identité vient de : la palette + la carte des 10 îles + les contenus + les personnes + la diaspora + la culture.

### 37. Résultat recherché

« C'est une vraie plateforme technologique professionnelle, mais elle a été pensée pour nous. » Premium, moderne, simple, rapide, communautaire, capverdienne.

### 38. Priorité de développement

1. Refonte visuelle
2. Nouvel onboarding
3. Carte interactive des 10 îles
4. Sélection des îles dans le profil
5. Personnalisation du feed (îles, ville, pays, intérêts)
6. Page « Mes îles »
7. Pages communautaires des 10 îles
8. Découverte des talents
9. Événements
10. Opportunités

### 39. Règle finale

Ne pas modifier la palette actuelle. Ne pas ajouter d'emojis à l'interface. Ne pas surcharger l'écran. Ne pas utiliser trop de gradients. Ne pas copier Instagram ou TikTok. Créer une identité propre à Nôs Comunidade.

**Signature visuelle** : Nôs Comunidade — 10 îles. Une communauté. Un monde. La carte des 10 îles doit devenir l'un des éléments graphiques les plus importants de toute l'application.
