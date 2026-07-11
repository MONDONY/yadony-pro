# Spec — Statut DRAFT d'un trajet (brouillon)

> Date : 2026-07-11 · Statut : validé en brainstorming · Portée : dony-back + dony-pro (web) + dony_app (Flutter)

## Objectif

À la création d'un trajet, le voyageur choisit entre **publier** immédiatement ou **enregistrer comme brouillon**. Un brouillon est invisible des expéditeurs, modifiable, et publiable plus tard. Quota : **1 brouillon** pour un voyageur standard, **10** pour un voyageur PRO (valeurs configurables).

## Décisions actées

| Question | Décision |
|---|---|
| Quota brouillons | 1 standard / 10 PRO, configurable via `config.limits()` |
| Périmètre | Back + web pro + app Flutter (les 3, back en premier) |
| Contrôles KYC / limite mensuelle / suspension | À la **publication** (création de brouillon libre, sauf suspension de publication qui reste bloquante) |
| Complétude du brouillon | **Complet mais non publié** — mêmes validations de champs qu'une annonce normale |
| Approche technique | **A** — statut `DRAFT` dans l'enum existant + endpoint `publish` (pas de table séparée, pas de flag booléen) |

## 1. Backend (dony-back)

### Modèle
- `AnnouncementStatus` : ajouter `DRAFT`. Colonne `status VARCHAR(20)` sans contrainte → **aucune migration Flyway**.

### Création — `POST /announcements`
- `AnnouncementRequest` : champ optionnel `saveAsDraft` (booléen, défaut `false`). Absent → comportement actuel inchangé (rétro-compatible avec l'app mobile déployée).
- Si `saveAsDraft=true` :
  - Contrôles : **suspension de publication** (bloquante) + **quota brouillons** : `countByTravelerIdAndStatus(travelerId, DRAFT)` ≥ limite → `403 draft-limit-reached` (« Limite de brouillons atteinte. Passez en PRO pour en créer davantage. »).
  - **Pas** de contrôle KYC ni de limite mensuelle à ce stade.
  - Statut initial `DRAFT`.
- Limites dans la config applicative (pattern `monthlyAnnouncements`) : `maxDrafts` (1) et `maxDraftsPro` (10).

### Publication — `POST /announcements/{id}/publish` (nouveau)
- Auth : propriétaire uniquement (ownership vérifié comme sur `PUT`).
- Préconditions : statut `DRAFT` sinon `422 not-a-draft`.
- Contrôles exécutés (ordre) :
  1. Suspension de publication → `403 publishing-suspended`
  2. KYC vérifié → `403 kyc-not-verified`
  3. Limite mensuelle non-PRO → `403 pro-limit-reached`
  4. Date de départ future → `422 departure-date-passed` (le brouillon reste modifiable pour corriger)
- Succès : `DRAFT → ACTIVE`, entrée `audit_log` `ANNOUNCEMENT_PUBLISHED`, réponse = annonce détaillée.

### Règle corrigée — limite mensuelle
- Le count mensuel (`countByTravelerIdAndCreatedAtBetween`) doit **exclure les DRAFT** : un brouillon ne consomme pas le quota mensuel. Le quota se consomme à la **publication** (et à la création directe en ACTIVE).
- Nouvelle requête : count mensuel par `createdAt` **et** `status != DRAFT` (ou équivalent sur la date de publication).

### Audit des requêtes existantes (aucune fuite de DRAFT)
| Requête | Attendu |
|---|---|
| Recherche publique (`hasStatus(ACTIVE)`) | déjà exclu ✅ |
| Scheduler transitions ACTIVE/FULL → IN_PROGRESS | filtre par statuts, DRAFT ignoré ✅ (vérifier) |
| `GET /travelers/{id}/announcements` (profil public) | exclure DRAFT |
| `GET /announcements/my` | **inclure** DRAFT (+ filtre `status=DRAFT` fonctionnel) |
| Corridors (`/announcements/my/corridors`) | choix : inclure (corridors du voyageur) — acceptable, pas de fuite publique |
| Stats voyageur / matching / alertes corridor | exclure DRAFT de tout ce qui matche ou compte des trajets visibles |
| Création de bid sur une annonce | déjà impossible hors ACTIVE (vérifier `:818`) ✅ |

### Erreurs
- RFC 7807 `ProblemDetail` partout, codes : `draft-limit-reached`, `not-a-draft`, `publishing-suspended`, `kyc-not-verified`, `pro-limit-reached`, `departure-date-passed`.

## 2. Front web (dony-pro)

### Types & service
- `TripStatus` + `'DRAFT'` ; `TripFilter` + `'BROUILLONS'` → `status=DRAFT`.
- `tripsService.createAnnouncement(payload, { saveAsDraft })` ; `tripsService.publishAnnouncement(id)`.

### Formulaire de création
- Pied de formulaire : « Publier le trajet » (primaire) + « Enregistrer comme brouillon » (secondaire). Mêmes validations de champs.
- Brouillon sauvegardé → redirection `/trajets?filter=BROUILLONS` + toast.
- `403 draft-limit-reached` → message avec upsell PRO.

### Liste `/trajets`
- Chip « Brouillons » (+ compteur si > 0), badge `Brouillon` (ton neutre/ambre) sur cartes et tableau.

### Détail `/trajets/[id]`
- Brouillon : bannière « Ce trajet est un brouillon — invisible pour les expéditeurs » + bouton « Publier ».
- Erreurs de publication mappées : `kyc-not-verified` → CTA `/parametres` ; `departure-date-passed` → CTA « Modifier » ; `pro-limit-reached` → message limite mensuelle.
- Onglets colis/KPIs : états vides naturels (aucun bid possible sur un DRAFT).

### Recherche ⌘K
- Les brouillons remontent via `/announcements/my` — rien à changer.

## 3. App Flutter (dony_app)

Feature `matching/` existante.

### Data
- `AnnouncementRepository.createAnnouncement(..., saveAsDraft)` ; nouveau `publishAnnouncement(id)`.
- Enum Dart `AnnouncementStatus` + `draft`.

### BLoC
- `announcement_form_bloc` : soumission avec `saveAsDraft` (même validation).
- `announcement_bloc` : event `AnnouncementPublishRequested(id)` → repo + refresh, états d'erreur mappant les codes ProblemDetail.

### UI
- Écran création : bouton primaire « Publier » + secondaire « Enregistrer comme brouillon ». Si bottom sheet → boutons dans `stickyBottom` (règle repo obligatoire).
- Liste « Mes trajets » : filtre/section « Brouillons », badge.
- Détail brouillon : bannière + « Publier » ; erreur KYC → navigation écran KYC ; erreur limite → bottom sheet upsell PRO.

## 4. Tests & qualité (les 3 projets)

- **Back** : unit (quotas draft 1/10, transitions, exclusion du count mensuel, chaque contrôle de publish) + integration MockMvc (`POST /announcements` draft, `POST /publish` → 200/403/422 par code). Couverture ≥ 90 %.
- **Web** : specs service (`saveAsDraft`, `publishAnnouncement`), composables, widgets (boutons formulaire, bannière, chip filtre). TDD.
- **Flutter** : tests BLoC (soumission draft, publication, erreurs) + widget tests (boutons, badge, bannière). TDD.
- Audit_log vérifié en test d'intégration pour `ANNOUNCEMENT_PUBLISHED`.

## 5. Séquencement

1. **dony-back** (porte toute la règle) → PR
2. **dony-pro** (web) → PR
3. **dony_app** (Flutter) → PR

Chaque projet : branche `feature/trip-draft-status`, TDD, tous tests verts avant PR.

## Hors périmètre

- Brouillons partiels (champs incomplets) — écarté.
- Expiration automatique des brouillons — non demandé ; un brouillon dont la date passe reste en DRAFT, corrigeable.
- Notifications/relances sur brouillons dormants.
