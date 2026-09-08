# Iniciativas Content — vision produit

> Le logiciel de gestion et de publication automatique de contenus pour les réseaux sociaux.
> Version resserrée du cahier des charges (cap produit). Le détail technique écran par écran
> vit dans [`CAHIER-DES-CHARGES-RESEAUX.md`](./CAHIER-DES-CHARGES-RESEAUX.md).

## 1. Présentation du projet

**Iniciativas Content** est un logiciel destiné aux agences de marketing digital et aux
professionnels qui gèrent plusieurs comptes de réseaux sociaux.

Objectif principal : simplifier et automatiser la **création, la préparation, la programmation
et la publication** de contenus sur plusieurs réseaux sociaux depuis une seule plateforme.

Gérer plusieurs clients en même temps et publier leurs contenus automatiquement sur :
**Instagram · TikTok · Facebook**.

> Importer → créer → adapter → programmer → publier.

## 2. Gestion des clients

L'utilisateur crée ses clients. Chaque client possède son propre espace avec ses réseaux
sociaux connectés, sa **bibliothèque de contenus**, son **calendrier** et ses **paramètres**.

## 3. Connexion aux réseaux sociaux

Connecter les comptes directement depuis l'application : **Connecter Instagram / Facebook /
TikTok**, via les systèmes d'autorisation officiels des plateformes. Une fois connectés, on
programme et publie depuis le logiciel. Le logiciel **détecte** une déconnexion ou une
autorisation à renouveler.

## 4. Bibliothèque de contenu

Par client : stockage des photos et vidéos. Import par **glisser-déposer** ou **+ Ajouter des
fichiers**. Classement : Vidéos · Photos · Contenus montés · Contenus programmés · Contenus
publiés. Recherche rapide (ex. « Interview septembre »).

## 5. Studio vidéo — **le cœur du logiciel**

Le montage automatique de vidéos longues en shorts est **le cœur du produit**, dans l'esprit de
Clipzi / Opus Clip, mais intégré directement à la gestion des clients. Spec technique complète :
[`STUDIO-VIDEO-IA.md`](./STUDIO-VIDEO-IA.md).

L'utilisateur importe une vidéo longue (10, 20, 60 min). Le logiciel l'**analyse
automatiquement** : moments forts, phrases importantes, changements de sujet, passages
émotionnels, silences et passages inutiles. Il propose ensuite **8 à 15 extraits** (30 / 45 /
60 s), chacun avec un **hook**, une **raison** et un **score** :

```
🔥 Clip 01 — 00:42 — 92/100      Clip 02 — 00:35 — 78/100      Clip 03 — 00:57 — 71/100
   Clip 04 — 00:48 — 64/100      Clip 05 — 00:31 — 61/100      …
```

Le score combine force du hook, autonomie du propos, clarté, rythme, émotion et durée.
L'utilisateur sélectionne, rejette ou ajuste (in/out, hook) les extraits.

**Variantes A/B/C** : un même clip peut produire plusieurs versions avec des hooks différents,
pour tester plusieurs accroches.

**Boucle fermée** : les résultats réels des publications (vues, watch time) reviennent
alimenter la sélection — le logiciel apprend quelles durées, quels hooks et quels sujets
performent chez *ce* client.

## 6. Montage automatique

Sur un clip sélectionné : couper les silences · cuts dynamiques · supprimer les passages
inutiles · améliorer le son · recadrage automatique · détection du visage · suivi du sujet
principal · sous-titres · logo · style du client. But : réduire au maximum le montage manuel.

## 7. Détection automatique du Hook

Analyse du contenu → propositions de formulations, ex. :
« Voici l'erreur que tout le monde fait. » · « Personne ne vous explique ça. » · « Voici ce
que j'aurais aimé savoir avant. » L'utilisateur choisit ou modifie le texte.

## 8. Sous-titres intelligents

Transcription automatique → génération des sous-titres. Styles : Simple · Dynamique · Mot par
mot. **Style par client** réutilisé automatiquement (ex. police Montserrat, position centre,
animation dynamique, logo automatique).

## 9. Gestion automatique des formats

Plusieurs formats depuis une même vidéo :

| Format | Usage |
|---|---|
| **9:16** vertical | TikTok, Instagram/Facebook Reels, Stories |
| **4:5** portrait | Instagram Feed |
| **1:1** carré | Instagram / Facebook |
| **16:9** horizontal | Facebook, YouTube, vidéos classiques |
| **Original** | conserve le format source |

Cadrage adapté automatiquement via la détection du sujet principal.

## 10. Détection du format

Avant publication, analyse automatique : résolution · ratio · durée · taille du fichier ·
présence de l'audio · compatibilité avec le réseau choisi. Affiche **✅ Compatible** ou
**⚠️ Modification nécessaire**. But : éviter les erreurs au moment de publier.

## 11. Création de publication

Bouton **Créer une publication** → sélection des réseaux (☑ Instagram ☑ TikTok ☑ Facebook).
Le logiciel prépare automatiquement les versions nécessaires.

## 12. Générateur de hashtags

Bouton **✨ Générer les hashtags** → analyse du contenu → hashtags pertinents. Ajouter tout /
supprimer certains. **Groupes de hashtags réutilisables**.

## 13. Publication multi-réseaux

Une seule création → plusieurs réseaux. **Légende différente par réseau** lorsque nécessaire.

## 14. Calendrier éditorial

Visualisation des publications programmées. Carte = miniature · réseau · date · heure · statut
(Brouillon · Programmé · Publié · Échec). **Drag & Drop** pour déplacer les publications.

## 15. Programmation automatique

Date · Heure · Réseaux → **PROGRAMMER**. Le logiciel prend en charge la publication à l'heure
choisie. Ex. : 10 septembre — 18:30 · Instagram/TikTok/Facebook · statut **Programmé**.

## 16. Publication automatique

À l'heure dite, publication automatique. **🟢 Publié** / **🔴 Échec** avec la raison expliquée
(ex. « Publication TikTok impossible : connexion expirée. ») + bouton **Reconnecter TikTok**.

## 17. Gestion simple des contenus

Modifier rapidement une publication : vidéo · photo · légende · hashtags · réseau · date ·
heure. **Dupliquer** une publication puis ne changer que la date, par exemple.

## 18. Résultats

Page simple, par client : vues · likes · commentaires · partages · abonnés · portée. Pas un
outil d'analyse complexe — juste suivre les résultats des publications.

## 19. Interface générale

Extrêmement simple. Menu principal : **Clients · Contenus · Studio · Calendrier · Résultats**.
Bouton permanent **+ CRÉER UN POST**. Créer une publication en quelques clics.

## 20. Workflow principal

1. Choisir un client
2. Importer une vidéo ou une photo
3. Ouvrir le Studio
4. Détecter les meilleurs passages
5. Créer les clips
6. Monter automatiquement
7. Générer le Hook
8. Générer les sous-titres
9. Adapter le format
10. Générer les hashtags
11. Choisir Instagram / TikTok / Facebook
12. Choisir la date et l'heure
13. Programmer
14. Publication automatique
15. Voir les résultats

## 21. Principes

- **Simple** — aucune compétence technique requise.
- **Rapide** — le maximum d'actions automatisé.
- **Centralisé** — tout depuis une seule interface.

## 22. Objectif final

Gérer plusieurs clients et plusieurs réseaux simultanément avec beaucoup moins de travail
manuel. Idée centrale : **une vidéo longue devient plusieurs contenus optimisés, adaptés
automatiquement aux différents réseaux, puis programmés et publiés depuis un seul logiciel.**
Avant tout un outil de **production et d'automatisation**, avec une interface simple, rapide,
intuitive.

---

## Correspondance avec l'implémentation (au 2026-09-08)

| Section | Implémenté | Manque |
|---|---|---|
| 2, 3 | `Company`, `SocialAccount`, OAuth Meta/TikTok, détection `EXPIRED` | — |
| 11, 13, 15, 16 | `Publication` + `PublicationTarget` (légende/hashtags par réseau), scheduler, fallback par capacité, échec expliqué | — |
| 17 | Modification | **Duplication** |
| 4 | `MediaAsset` (existant) | Bibliothèque UI, classement par statut, recherche |
| 5–10 | — (spec posée : [`STUDIO-VIDEO-IA.md`](./STUDIO-VIDEO-IA.md), pipeline + modèle de données + phasage Studio-first) | **Studio Vidéo** — V1 : ASR au mot, retrait silences, sélection LLM scorée, rendu 9:16, 1 style de sous-titres, center-crop. V1.5 : recadrage active-speaker, 4 formats, variantes hook. V2 : zoom dynamique, boucle fermée analytics |
| 12 | — | Générateur hashtags IA + groupes |
| 14 | Liste des publications | **Calendrier + drag & drop** |
| 18 | — | **Page Résultats** (ingestion métriques) |
| 19 | Nav dashboard complète | Nav simplifiée 5 entrées + bouton **+ CRÉER UN POST** |
