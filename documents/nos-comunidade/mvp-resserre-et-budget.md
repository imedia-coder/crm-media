# Nôs Comunidade — MVP resserré & trame de budget

*Document de travail — complète le cahier des charges v1.0 (août 2026), sections 29 et 36.*

---

## 1. MVP resserré

Objectif : valider la traction auprès des ~60 ambassadeurs (20 artistes, 20 influenceurs, 10 entrepreneurs, 10 associations — section 33) avant d'investir dans les 17 fonctionnalités listées en section 29.

### Inclus (v1 — lancement)

| # | Fonctionnalité | Pourquoi indispensable |
|---|---|---|
| 1 | Inscription / connexion (e-mail + Google/Apple) | Accès de base |
| 2 | Profil (photo, bio, pays, ville, activité, type de profil) | Cœur de la promesse "mise en valeur des talents" |
| 3 | Publication texte / photo | Fil minimal viable |
| 4 | Fil d'actualité (chronologique, pas d'algo) | Écran principal |
| 5 | Likes + commentaires | Interaction de base, faible coût dev |
| 6 | Suivre / ne plus suivre | Mécanique réseau essentielle |
| 7 | Recherche par nom + filtre pays/ville | Différenciateur clé (section 12) — priorité haute |
| 8 | Signalement basique (motif + envoi) | Minimum légal/confiance, pas de modération auto |

### Reporté à v1.1 (3-6 mois post-lancement, selon traction)

- Messagerie privée
- Notifications push
- Événements (peut démarrer en lien externe posté dans le fil le temps que la fonctionnalité existe)
- Profils vérifiés / badge
- Back-office admin dédié → **remplacer par Airtable/Notion + accès base de données direct** pour les 3-6 premiers mois (suppression de compte, modération, stats de base gérables manuellement à moins de 5 000 utilisateurs)
- Vidéo (photo/texte seuls au lancement — la vidéo multiplie le coût de stockage/bande passante dès le jour 1)
- Statistiques avancées (dashboard) — un export CSV manuel suffit au démarrage

### Reporté à v2+ (déjà acté section 29)

Marketplace, billetterie complète, algorithme de recommandation, pub automatisée, live, monétisation créateurs avancée, traduction automatique.

**Effet attendu** : ce périmètre coupe grossièrement 40-50 % de l'effort de développement du MVP tel que décrit en section 29, sans toucher à la proposition de valeur testée par les ambassadeurs (découverte + mise en réseau géolocalisée).

---

## 2. Trame de budget (fourchettes à valider par devis)

*But : donner une cible avant l'appel d'offres (section 41), pour que les devis reçus soient comparables et réalistes.*

### 2.1 Développement initial (MVP resserré ci-dessus)

| Poste | Fourchette indicative* |
|---|---|
| UX/UI (maquettes + charte graphique + prototype cliquable) | à chiffrer |
| Développement mobile (Flutter, iOS + Android, code commun) | à chiffrer |
| Backend + API + base de données | à chiffrer |
| Infrastructure de départ (hébergement, stockage photo) | à chiffrer |
| Tests + correction de bugs | à chiffrer |
| Publication App Store + Google Play | frais fixes Apple (99 $/an) + Google (25 $ unique) |

*Les montants sont volontairement laissés vides : à remplir avec 3 devis d'agences/freelances comparables, en précisant à chacun le périmètre resserré ci-dessus (pas le périmètre complet section 29) pour obtenir des offres comparables.*

### 2.2 Coûts récurrents mensuels — postes absents ou sous-estimés dans le cahier des charges original

| Poste | Remarque |
|---|---|
| Modération de contenu (FR/PT/créole capverdien) | Absent du budget section 36 — critique dès quelques milliers d'utilisateurs actifs, même à temps partiel |
| Hébergement + stockage (photo, à terme vidéo) | Évolue avec le volume d'usage, prévoir un palier de scaling |
| Support utilisateur | Peut être mutualisé avec la modération au démarrage |
| Accompagnement juridique (RGPD + CGU multi-juridictions : UE, Cap-Vert, Sénégal, États-Unis) | Section 26 ne couvre que le RGPD — les autres marchés cibles (section 4) ont des cadres différents |
| Marketing / production de contenu pré-lancement (section 33-34) | Interviews, portraits, vidéos des ambassadeurs |

### 2.3 Recommandation de séquencement

1. Fixer une fourchette budgétaire cible en interne (ordre de grandeur, avant devis)
2. Trancher la stack (proposition : Flutter pour le mobile — un seul rendu graphique garanti identique iOS/Android)
3. Envoyer le périmètre MVP resserré (section 1 ci-dessus) à 3 prestataires pour devis comparables
4. Réserver 20-30 % du budget dev initial comme marge pour la v1.1 (messagerie, notifications) une fois la traction validée

---

*Document à réviser après les premiers devis reçus et après les 15-20 interviews de validation de la disposition à payer du profil PRO (recommandé dans l'analyse précédente).*
