# Plan d'implémentation — dony-pro, extension web voyageur pro

> Date : 2026-07-11 · Source : analyse croisée front (`app/`) × back (`dony-back`) × docs roadmap.
> Objectif produit : faire de dony-pro une **vraie extension web** de l'app mobile, permettant au **voyageur pro** de gérer ses envois de colis avec **actions rapides** et **recherche rapide**.

## Constat de départ

- **Tous les endpoints appelés par le front existent côté back — 0 endpoint en 404.** Le front est intégralement câblé à du vrai backend (25 pages réelles, 508 tests verts).
- Le manque n'est **pas** côté back : c'est que le back **expose des capacités que le front n'exploite pas encore**. Le plan ci-dessous = brancher ces capacités dormantes + corriger la dette front.
- Convention repo : feature-first (`app/features/<x>/{bloc|composables,data,services,presentation|components}`), state cross-feature Pinia, HTTP via `useApi()`, GoRouter/pages Nuxt. Tests ≥ 90 %.

---

## P0 — Corrections (dette, rapide, haute valeur)

### P0.1 — Commission dynamique (retirer le 0.88 en dur)
- **Problème** : commission `0.88` / 12 % codée en dur dans `features/colis/services/bidsService.ts:61` et `features/trajets/services/tripsService.ts:119`.
- **Endpoint** : `GET /config/commission-rate` (public, déjà consommé par pricing).
- **Action** : composable/store `useCommissionRate()` (cache in-memory + Pinia), injecté dans les mappers de bids/trips. Fallback 0.12 si l'appel échoue.
- **Fichiers** : `app/features/config/` (nouveau service partagé ou étendre `pricingService`), `bidsService.ts`, `tripsService.ts`.
- **Accept.** : changer le taux back se reflète dans « revenus nets » sans redeploy front. Tests mappers avec taux mocké.
- **Effort** : S.

### P0.2 — Corridors dynamiques (retirer PRICING_CORRIDORS en dur)
- **Problème** : liste corridors en dur `PRICING_CORRIDORS` (`pages/assistant-prix/index.vue`).
- **Endpoint** : `GET /cities/corridors/popular` (+ `GET /cities/search` pour l'autocomplétion).
- **Action** : `pricingService.getPopularCorridors()`, remplacer la constante.
- **Fichiers** : `features/pricing/services/pricingService.ts`, `pages/assistant-prix/index.vue`.
- **Accept.** : corridors viennent du back. Test service.
- **Effort** : S.

### P0.3 — Photo de refus colis (retirer refusalPhotoUrl: null)
- **Problème** : `refusalPhotoUrl: null` toujours envoyé (`tripsService.ts:226`) → pas de preuve au refus.
- **Endpoint** : `POST /storage/upload/tracking` (multipart) puis `POST /bids/{bidId}/refuse-parcel` avec l'URL.
- **Action** : champ upload optionnel dans la modale de refus, upload → URL → refuse-parcel.
- **Fichiers** : `features/trajets/components/*RefuseModal*`, `tripsService.ts`.
- **Accept.** : photo uploadée jointe au refus. Test flux.
- **Effort** : M.

### P0.4 — Enrichissement valeurs à 0 (rating, reservedRevenue, lat/lng)
- **Problème** : `rating:0`, `reservedRevenueEuros:0`, `lat/lng:0` en dur (le back ne les fournit pas sur la **liste**).
- **Action** : décision — soit enrichir la réponse back (préféré), soit 2e appel détail au besoin. **À trancher avec back** avant de coder ; ne pas laisser 0 silencieux.
- **Effort** : dépend back. **Bloquant produit faible → P0 optionnel / P1.**

---

## P1 — Recherche rapide (cœur de la demande)

### P1.1 — Palette de commande globale ⌘K
- **Manque** : aucune recherche transverse ni navigation clavier.
- **Endpoints** : `GET /tracking/search` (colis par code/token, public), `GET /announcements/my?q=` (trajets), `GET /travelers/me/bids?q=` (colis), + navigation locale (aller à un écran).
- **Action** : nouvelle feature `features/search/` — overlay ⌘K (raccourci global), sections « Colis / Trajets / Demandes / Aller à… », debounce, résultats cliquables (deep-link écran détail).
- **Fichiers** : `features/search/{components,composables,services}`, hook clavier global (layout).
- **Accept.** : ⌘K ouvre, tape un code de suivi → colis trouvé → clic ouvre le détail. Tests composable + widget.
- **Effort** : L.

### P1.2 — Recherche colis par code de suivi (lookup rapide)
- **Endpoint** : `GET /tracking/search`.
- **Action** : entrée dédiée (dans ⌘K et/ou barre colis) « Rechercher un colis par code ».
- **Effort** : S (mutualisé avec P1.1).

---

## P1 — Actions rapides voyageur (incidents / gestion)

### P1.3 — No-show & incidents
- **Manque** : aucune UI pour les litiges d'exécution côté voyageur.
- **Endpoints** [TRAVELER] : `POST /cancellations/bids/{bidId}/report-noshow`, `POST /cancellations/bids/{bidId}/confirm-return`, `GET /cancellations/bids/{bidId}/return-code`, `POST /bids/{bidId}/cancel-after-handover`. (Côté expéditeur existants pour info : `report-traveler-noshow`, `contest-noshow`.)
- **Action** : menu « actions » sur la carte/détail colis selon statut → signaler no-show, confirmer retour (afficher return-code), annuler après remise. Confirmations explicites (irréversible).
- **Fichiers** : `features/colis/` + `features/trajets/components/TripDetailBids.vue` (actions contextuelles), nouveau `cancellationService` (respecter le package dédié côté back).
- **Accept.** : chaque action mappée au bon endpoint + statut mis à jour. Tests service + états.
- **Effort** : L.

### P1.4 — Notation de l'expéditeur
- **Manque** : le pro ne peut ni noter un expéditeur ni voir ses notes.
- **Endpoints** [TRAVELER] : `POST /ratings/traveler-to-sender`, `GET /ratings/pending`, `GET /ratings/me/received`.
- **Action** : feature `features/ratings/` — badge « notations en attente » (cockpit), modale de notation post-livraison, section « mes notes reçues » (profil).
- **Fichiers** : `features/ratings/{...}`, tuile cockpit, `pages/mon-profil`.
- **Accept.** : noter un expéditeur après livraison ; pending décrémente. Tests.
- **Effort** : M.

---

## P2 — Fidélisation / audience / matching proactif

### P2.1 — Litiges voyageur (écran liste)
- **Correctif doc** : `GET /disputes/me` [TRAVELER] **existe** (la roadmap le disait manquant → faux).
- **Action** : `features/disputes/` liste read-only + détail. Actions de résolution = admin only (hors scope pro).
- **Effort** : M.

### P2.2 — Mes abonnés
- **Correctif doc** : `GET /me/subscribers` [TRAVELER] **existe**.
- **Action** : section « audience » dans profil public (nb abonnés + liste).
- **Effort** : S.

### P2.3 — Alertes corridor (matching proactif)
- **Endpoints** [TRAVELER] : `GET/POST/PUT/DELETE /me/corridor-alerts`, `GET /me/corridor-alerts/{id}/matches`.
- **Action** : feature `features/alertes-corridor/` — CRUD d'alertes (Paris→Dakar, poids, prix) + liste des matches. Complète « Demandes ».
- **Effort** : M.

### P2.4 — Favoris
- **Endpoints** [TRAVELER] : `GET /favorites/trips`, `GET /favorites/package-requests`, `PUT/DELETE /favorites/{type}/{id}`, `GET /favorites/ids`.
- **Action** : bouton favori sur demandes/trajets + vue « sauvegardés ».
- **Effort** : M.

---

## P2 — Finances

### P2.5 — Wallet
- **Endpoints** : `GET /wallet/balance`, `POST /wallet/topup`.
- **Action** : carte solde dans Activité/Paramètres + recharge.
- **Effort** : M.

### P2.6 — Méthode de commission cash
- **Endpoints** [TRAVELER] : `POST/GET/DELETE /traveler/commission-method`, `/setup`, `/save`, `POST /bids/{id}/accept-with-commission`, `/confirm-acceptance`.
- **Action** : setup pour pros acceptant le cash (paiement de la commission dony).
- **Effort** : L.

---

## P3 — Compte / préférences

### P3.1 — Préférences de notification fines
- **Endpoints** : `GET/PUT /notifications/preferences`, `GET/PUT /notifications/package-match-alert`, `POST /notifications/{id}/ack`.
- **Action** : panneau préférences dans `/parametres` + `/notifications`.
- **Effort** : M.

### P3.2 — Compte & carnet d'adresses
- **Endpoints** : `PATCH /auth/me`, `POST /auth/me/avatar`, `GET/PUT /auth/me/privacy-settings`, `PUT /auth/me/fcm-token` ; carnet : `/addressbook/pickup-addresses`, `/addressbook/delivery-addresses` [TRAVELER].
- **Action** : édition profil (avatar, confidentialité), FCM web push, carnet d'adresses pickup/delivery.
- **Effort** : L.

---

## Séquencement conseillé

1. **Sprint 1 (P0)** : P0.1, P0.2, P0.3 — dette + cohérence financière. Trancher P0.4 avec back.
2. **Sprint 2 (P1 recherche)** : P1.1 + P1.2 — palette ⌘K + lookup colis. **Différenciateur produit majeur.**
3. **Sprint 3 (P1 actions)** : P1.3 + P1.4 — incidents + notation. Rend le pro autonome sur le web.
4. **Sprint 4 (P2)** : alertes corridor, litiges, abonnés, favoris.
5. **Sprint 5 (P2 finances / P3)** : wallet, cash commission, préférences, compte.

## Règles transverses (à respecter à chaque item)

- Nouveau service = 1 fichier `*Service.ts` par feature, appels via `useApi()` (jamais `$fetch` direct).
- State via Pinia store si cross-feature ; sinon composable local.
- Tests unitaires service + widget des écrans critiques, couverture ≥ 90 %.
- Erreurs back = `ProblemDetail` RFC 7807 → gérer `error.data` proprement (toasts).
- Actions irréversibles (no-show, annulation, retour) = confirmation explicite.
- Respecter la logique d'annulation côté back (package `cancellation/`) — ne pas dupliquer.
- Design : appliquer les primitives « Comptoir » (Card/StatTile/Badge/Button/DataTable/EmptyState).
