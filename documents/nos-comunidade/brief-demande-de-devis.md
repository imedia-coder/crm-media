# Nôs Comunidade — Brief pour demande de devis

*À envoyer à 3 prestataires (agences ou freelances) pour obtenir des offres comparables. Périmètre volontairement resserré par rapport au cahier des charges complet — voir note en fin de document.*

---

## 1. Le projet en une phrase

Application mobile communautaire (iOS + Android) connectant la communauté capverdienne et sa diaspora à travers le monde : découverte de talents, profils, fil d'actualité, mise en réseau par géolocalisation.

## 2. Cibles géographiques prioritaires

Cap-Vert, France, Portugal, Pays-Bas, Luxembourg, Italie, États-Unis, Sénégal.

## 3. Langues au lancement

Français, portugais. (Architecture i18n pensée pour ajout futur : créole capverdien, anglais, néerlandais.)

## 4. Périmètre fonctionnel demandé (MVP)

Merci de chiffrer **exactement** ce périmètre — ne pas inclure les fonctionnalités listées en section 6 ("hors périmètre").

| Fonctionnalité | Détail |
|---|---|
| Inscription / connexion | E-mail + mot de passe, connexion Google/Apple |
| Création de profil | Photo, photo de couverture, bio, pays, ville, activité, type de profil (membre/artiste/créateur/entrepreneur/association/personnalité) |
| Publication | Texte + photo (pas de vidéo au lancement) |
| Fil d'actualité | Chronologique, pas d'algorithme de recommandation |
| Interactions | Like, commentaire |
| Abonnements | Suivre / ne plus suivre |
| Recherche | Par nom, filtre pays/ville, filtre catégorie |
| Signalement | Formulaire simple (motif + envoi), traitement manuel côté équipe |
| Accès données admin | Accès direct base de données ou interface minimale (liste utilisateurs, suppression/suspension de compte, suppression de contenu) — **pas** de back-office complet avec dashboard de statistiques |

## 5. Parcours utilisateur et maquettes UI (référence)

Une première itération design existe déjà pour ce périmètre — parcours utilisateur, wireframes, charte graphique et maquettes des 8 écrans. Ce n'est **pas un livrable figé** : le prestataire retenu pourra la challenger, mais elle sert de base commune pour que les 3 devis partent du même niveau de définition plutôt que d'interprétations divergentes.

| Document | Lien |
|---|---|
| Parcours utilisateur (flux des 8 écrans) | https://claude.ai/code/artifact/45093f7a-8cfe-4610-a292-d66fcc22d8b7 |
| Wireframes basse fidélité | https://claude.ai/code/artifact/22283df5-74ad-4026-9b31-405f20ac8972 |
| Charte graphique (palette, typographie) | https://claude.ai/code/artifact/a8d50e3f-9746-4313-9723-8662e2d4243f |
| Maquettes UI habillées des 8 écrans | https://claude.ai/code/artifact/7eb17695-db59-49db-a1b9-76001d085252 |
| Prototype cliquable (navigable au clic) | https://claude.ai/code/artifact/4df07c87-917c-40bd-88b9-6259c1cad7c3 |

⚠️ **Ces liens sont privés par défaut.** Avant de les envoyer aux prestataires, ouvrir chaque page et utiliser le menu de partage pour la rendre accessible (ou exporter les écrans en images/PDF à joindre directement au brief).

## 6. Architecture technique souhaitée

- Mobile : base de code commune iOS/Android (Flutter recommandé — à confirmer/challenger par le prestataire avec justification si alternative proposée)
- Backend : au choix du prestataire, avec justification (Node.js, Python, ou autre)
- Base de données : PostgreSQL ou équivalent
- Stockage : cloud (photos uniquement au lancement)
- Notifications : non incluses dans ce lot (prévues en v1.1)

## 7. Explicitement hors périmètre de ce devis (à chiffrer séparément si possible, en option)

- Messagerie privée
- Notifications push
- Événements
- Profils vérifiés / badges
- Back-office admin complet avec statistiques
- Vidéo
- Marketplace, billetterie, publicité automatisée, live, monétisation créateurs

*Merci d'indiquer, pour chacun de ces éléments, un chiffrage indicatif séparé en "option v1.1" pour permettre une planification budgétaire en deux temps.*

## 8. Livrables attendus

1. Maquettes UX/UI + prototype cliquable (voir section 5 pour la base de départ déjà produite — le prestataire l'affine et produit la version finale)
2. Application iOS + Android (code source complet)
3. Backend + API + base de données
4. Accès admin minimal (voir section 4)
5. Documentation technique et de maintenance
6. Tests + correction des bugs
7. Mise en production (App Store + Google Play)
8. Comptes et accès à tous les services utilisés (transfert de propriété complet)

## 9. Propriété

Le client conserve la pleine propriété du code source, des données et des éléments graphiques.

## 10. Ce que nous attendons dans votre réponse

- Chiffrage détaillé par poste (design, mobile, backend, tests, mise en prod)
- Délai estimé par phase
- Stack technique proposée avec justification si différente de la section 5
- Coût de maintenance/évolution mensuel post-lancement (hors hébergement)
- Références de projets comparables (app communautaire ou réseau social de niche)
- Modalités de paiement (jalons)

---

**Note interne (à ne pas inclure dans l'envoi aux prestataires)** : ce périmètre correspond au MVP resserré défini dans [mvp-resserre-et-budget.md](mvp-resserre-et-budget.md). Ne pas envoyer le cahier des charges complet (section 29) tel quel aux prestataires : il inclut 17 fonctionnalités et produira des devis impossibles à comparer entre prestataires.
