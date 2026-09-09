# Nôs Comunidade — Analyse de l'architecture algorithmique proposée & roadmap v2

*Document de travail — analyse de deux propositions IA ("vision produit" + "architecture complète de l'algorithme") reçues le 16/08/2026, mises en regard de l'état réel de l'application (MVP resserré, [mvp-resserre-et-budget.md](mvp-resserre-et-budget.md)) et de sa base technique actuelle (Flutter + Express/Prisma/PostgreSQL, déployé sur Railway).*

---

## 1. Ce qu'on nous propose

Deux documents décrivent comment transformer l'application en "place publique numérique" de la diaspora capverdienne, avec :

- un feed algorithmique multi-flux (Pour toi / Communauté / Près de toi) au lieu du fil chronologique ;
- un système de **découverte progressive des talents** (viralité par paliers : 100 → 500 → 2 000 → 10 000 → 50 000 vues) ;
- des **tendances communautaires**, challenges hebdomadaires, badges, score de réputation interne ;
- une **carte de la diaspora**, un module opportunités/emploi, une messagerie contextuelle ;
- un moteur social graph (suggestions "personnes que vous pourriez connaître") ;
- un modèle économique freemium : FREE / PRO (5-10€/mois) / BUSINESS / ARTIST ;
- un dashboard admin complet, anti-spam par ML, anti-manipulation.

Le second document va jusqu'à proposer une architecture à 5 "moteurs" (recommandation, social, communautaire, viralité, personnalisation) avec formule de score détaillée.

---

## 2. Diagnostic

**Le fond est juste, mais l'échelle est fausse pour où on en est.**

Ces documents décrivent la feuille de route qu'une équipe produit *chez Meta ou TikTok* suivrait pour faire évoluer une app qui a déjà des millions d'utilisateurs actifs. Ce n'est pas un plan de développement pour les prochaines semaines. Deux problèmes concrets, pas seulement une question de goût :

1. **Les mécanismes décrits ont besoin de volume pour exister.** Le "test de viralité par paliers" (montrer une publication à 100 personnes, puis 500, puis 2 000...) suppose un bassin de dizaines de milliers d'utilisateurs actifs par ville. Avec les premiers testeurs (dizaines, peut-être centaines d'utilisateurs après le lancement ambassadeurs), il n'y a personne à qui "tester" une publication — la mécanique tombe à plat et complique le code pour rien.
2. **Ça inverse la logique de validation qu'on a choisie dès le départ.** Le [MVP resserré](mvp-resserre-et-budget.md) coupe volontairement 40-50 % du périmètre du cahier des charges pour valider la traction *avant* d'investir dans la complexité. L'algorithme de recommandation y est explicitement classé en "v2+, déjà acté section 29". Ces deux documents proposent l'inverse : construire la complexité Meta avant même d'avoir confirmé que les gens reviennent sur l'app.

**Ce qui est solide et vaut la peine d'être gardé pour plus tard** : la vision "place publique numérique" plutôt que "clone d'Instagram", le principe de donner une vraie chance aux nouveaux créateurs (pas seulement les gros comptes), le modèle économique freemium orienté visibilité pro plutôt que paywall utilisateur, et la structure en flux thématiques (Découvrir / Communauté / Près de toi). Ce sont de bonnes intuitions produit — juste prématurées en l'état.

---

## 3. État réel actuel de l'app (pour ancrer la roadmap)

Schéma Prisma actuel (`nos-comunidade-api/prisma/schema.prisma`) :

- `User` : email, nom, pays, ville, `activity` (texte libre), bio, `profileType` (MEMBRE / ARTISTE / CREATEUR / ENTREPRENEUR / ASSOCIATION), avatar.
- `Post` : texte, image, auteur, date.
- `Comment`, `Like`, `Follow`, `Report`.

Ce qui **n'existe pas encore** en base et serait nécessaire pour presque tout point 2+ de la roadmap ci-dessous : catégories/tags sur les publications, tracking du temps de visionnage ou des vues, compteur de partages, table d'événements, table d'opportunités, système de notifications, table de badges/réputation.

Le feed actuel (`GET /posts`) est strictement chronologique — c'est le comportement "v1" prévu depuis le début.

---

## 4. Roadmap proposée

### Phase 0 — Ne rien casser
Rien à faire ici : c'est un rappel que le feed chronologique actuel reste la bonne base tant qu'on n'a pas de retours des premiers testeurs TestFlight.

### Phase 1 — Cheap wins, sans ML, compatibles avec la base actuelle ✅ livré le 16/08/2026
Faisable en quelques jours, sur la stack existante (SQL/JS, pas de nouvelle infra) :

| Fonctionnalité | Ce que ça demande |
|---|---|
| Feed pondéré (intérêt + fraîcheur + engagement) au lieu du tri chronologique pur | Formule de score en JS côté API, aucune nouvelle table |
| Bonus "nouveaux créateurs" dans le classement | Règle simple sur `createdAt` du compte + nombre de posts |
| Onglet "Découvrir" séparé du feed principal | Nouvel écran Flutter + endpoint API filtré |
| Catégorie de publication à la création (Musique / Culture / Humour / Business / Sport / Événement...) | 1 champ `category` sur `Post` |
| Regroupement communauté par ville | Déjà en base (`User.city`), juste une vue/filtre à exposer |

### Phase 2 — Après les premiers retours terrain (post-lancement ambassadeurs)
Utile seulement une fois qu'on a des utilisateurs réels à qui parler et des données de comportement. Démarrée le 16/08/2026 avant d'avoir ces retours, à la demande explicite du porteur de projet — voir note ci-dessous :

- ✅ **Événements** (table `Event` + `EventInterest`) — livré le 16/08/2026 : création, liste triée par date à venir, filtre par ville, bouton « Intéressé » avec compteur. Pas encore de recommandation par intérêt (juste tri chronologique + filtre ville manuel).
- ⏳ Opportunités/emploi (nouvelle table `Opportunity`) avec mise en relation par mot-clé de profil.
- ⏳ Notifications (au-delà du strict nécessaire déjà noté en v1.1 dans le MVP resserré).
- ⏳ Défis/challenges hebdomadaires simples (une table `Challenge`, sélection manuelle des meilleurs contenus au début — pas besoin d'algo).

*Note : cette phase était conditionnée aux retours des premiers testeurs TestFlight, qui n'étaient pas encore disponibles au moment de l'implémentation d'Événements. Le porteur de projet a choisi de ne pas attendre. À surveiller : si les retours à venir contredisent ce qui a été construit, ce sera du travail à ajuster plutôt qu'à jeter — le module Événements reste petit et isolé.*

### Phase 3 — Quand il y a du volume réel (des milliers d'utilisateurs actifs)
C'est là que les mécanismes décrits dans les deux documents deviennent pertinents tels quels :

- Viralité progressive par paliers (100 → 500 → 2 000...).
- Score de réputation interne, anti-spam/anti-manipulation par détection de comportement.
- Vecteur d'intérêts par utilisateur, personnalisation fine du feed (règle 70/20/10 proposée dans le doc).
- Carte de la diaspora en temps réel.
- Dashboard admin complet (métriques DAU/rétention/viralité).
- Paliers de monétisation FREE/PRO/BUSINESS/ARTIST.
- Moteur social graph ("personnes que vous pourriez connaître").

Tenter de construire ces éléments avant d'avoir le volume qui les justifie, c'est de l'ingénierie prématurée : du code complexe à maintenir pour un mécanisme qui n'a littéralement rien à optimiser tant que la base d'utilisateurs est petite.

---

## 5. Recommandation

Ne pas attaquer "l'étape technique suivante" suggérée par les documents (spécifications complètes : base de données, API, pseudo-code, architecture backend) tant qu'on n'a pas de retours réels des testeurs TestFlight. Ce travail de spec sera beaucoup plus utile — et beaucoup plus juste — une fois qu'on aura des vrais chiffres d'usage à optimiser plutôt que des hypothèses.

**Mise à jour du 16/08/2026** : la Phase 1 est livrée et déployée en production (API Railway + web Railway + push vers `nos-comunidade` pour le prochain build Codemagic/TestFlight). Prochaine étape : recueillir les retours des premiers testeurs avant d'entamer la Phase 2.
