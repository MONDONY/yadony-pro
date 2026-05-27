# dony-pro — Inventaire & Roadmap

> **Date :** 2026-05-27
> **Statut :** source de vérité unique pour le portail web dony-pro.
> **Portée :** ce document fait l'état des lieux *réel* des fonctionnalités de dony-pro,
> liste les corrections de l'existant, et séquence les fonctionnalités à compléter.

dony-pro est le **portail web (Nuxt 3 / TypeScript)** destiné aux **voyageurs PRO**
(transporteurs vérifiés). Architecture feature-first : chaque feature sous `app/features/<x>/`
est autonome (`components/` + `composables/` + `services/` + `types/`). State cross-feature
dans `app/stores/` (Pinia). Auth Firebase Phone + OTP. Accès protégé par
`middleware/auth.global.ts` (authentifié) puis `middleware/pro-only.ts` (compte PRO).

---

## Partie 1 — Inventaire de l'existant

### Sections fonctionnelles (toutes câblées à des pages réelles)

| Section | Routes | Ce qui existe |
|---|---|---|
| **Cockpit** | `/cockpit` | Dashboard d'accueil : KPI analytics (`/travelers/me/analytics`), stats calendrier (`/travelers/me/calendar`), actions urgentes, compteur d'automations du jour |
| **Trajets** | `/trajets`, `/trajets/[id]`, `/trajets/[id]/modifier`, `/trajets/nouvelle-annonce` | CRUD complet des annonces : création (Google Places, mode transport, capacité valise/kg, prix/kg, catégories acceptées/refusées, cash), vue liste + calendrier, détail (overview, bids, revenue), modification, suppression. KPI par trajet (fill rate, revenu brut/net, commission, revenu/kg) |
| **Colis** | `/colis` | Table des bids reçus, filtres par statut + recherche, bulk actions, détail + historique, accept/reject, export CSV, tracking (n° + token) |
| **Demandes** | `/demandes` | Matching : demandes compatibles avec match score, filtres (poids/budget/type, tri), profil public expéditeur + avis (`/users/{id}/profile-public`, `/ratings/user/{id}`), créer un trajet depuis une demande, inviter un expéditeur |
| **Négociations** | `/negociations`, `/negociations/[id]` | Threads de négociation prix (PROPOSAL/COUNTER/ACCEPT/REJECT), rounds limités (`isMyTurn`/`canAccept`/`canCounter`), créer/soumettre/refuser un trajet dédié, banner trajet lié |
| **Automatisations** | `/automatisations` | 6 règles preset (auto-accept trusted, auto-reject overweight, auto-close full, alert capacity free, notify loyal senders, alert last-minute bid) + règles custom (conditions/actions), historique des déclenchements (success/failure) |
| **Activité** | `/activite` | KPI financiers par période (mois/trimestre/année), table des transactions (brut/commission/net par trajet), export fiscal PDF/CSV (summary, transactions, **DAC7**) |

### Transversal

- **Auth** (`app/features/auth/`) : Firebase Phone + OTP, sélecteur de pays, `/login`. Store
  `auth` (idToken, user, `isProAccount`). Enregistrement device web (`useDeviceRegistration`).
- **Landing** (`app/features/landing/`) : page marketing publique (hero, steps, testimonials,
  features, FAQ, CTA, app bridge) + `/upgrade` (écran « compte PRO requis »).
- **API client** (`composables/useApi.ts`) : `$fetch` avec injection `Authorization: Bearer` +
  `X-Device-Id`, redirection `/login` sur 401.

### État du backend

Tous les endpoints consommés par dony-pro existent côté `dony-back`. **Important :** les plans
`docs/plans/features/2026-05-13-B3-dashboard-voyageur-pro.md` et
`docs/plans/features/2026-05-13-A3-badge-kilo-pro.md` sont **périmés** — ils affirment que le
backend « n'est pas créé », alors que `TravelerStatsController` (analytics/calendar),
`BadgeService` (Kilo Pro), `FiscalExportController`, `upgrade-to-pro` et `ProfilePublicController`
sont bien implémentés. Ne pas s'y fier pour juger l'état réel.

---

## Partie 2 — Roadmap séquencée

**Stratégie retenue (Approche A — Fondations d'abord, grille tarifaire remontée tôt) :**
`P0 Corrections` → `P1 Autonomie` → `P1.5 Grille tarifaire` → `P2 Opérationnel` →
`P3 Pilotage` → `P4 Acquisition`.

> **Note d'effort :** quasiment toutes les fonctionnalités P1→P4 sont **du front Nuxt à brancher
> sur un backend déjà prêt**, pas du full-stack. Chaque feature suivra son propre cycle
> spec → plan → implémentation, en respectant l'architecture feature-first et la règle de
> couverture ≥ 90 % (`CLAUDE.md`).

### P0 — Corrections (fondation, bloquant)

| # | Correction | Détail |
|---|---|---|
| 1 | **Versionner dony-pro dans git** | Aujourd'hui `0` fichier tracké (`?? dony-pro/`). Tout le travail est hors contrôle de version → risque de perte. Créer une branche + premier commit. |
| 2 | **Réparer 3 tests cassés** | `tests/unit/features/colis/` : la recherche `senderSearch` a été remplacée par `trackingNumber`/`search` (+ colonne « n°suivi » dans l'export CSV) sans mettre à jour les tests (`useBids.spec.ts` ×2, `BidFilters.spec.ts`). Viole la règle « jamais de test rouge ». |
| 3 | **Corriger l'incohérence `BidFilters.vue`** | Émet encore `update:senderSearch` (ligne 15) alors que le composable utilise `search`/`trackingNumber`. Aligner l'émetteur sur le nouveau modèle. |
| 4 | **Nettoyer le worktree orphelin** | `dony-pro/.worktrees/feat-capacity-unit/` (travail abandonné). `vitest.config.ts` exclut `tests/e2e/**` mais **pas** `.worktrees/` → les tests du worktree polluent chaque run. Supprimer le worktree et/ou ajouter `.worktrees/**` aux exclusions vitest. |
| 5 | **Vérifier la couverture ≥ 90 %** | `npm run test:coverage`, compléter les tests manquants si sous le seuil. |

### P1 — Autonomie du voyageur _(backend prêt)_

Objectif : rendre le voyageur self-suffisant sur le web. Aujourd'hui il doit retourner sur
l'app mobile pour les actions critiques.

- **Page Paramètres / Profil** (nouvelle route, ex. `/parametres`) : infos perso, avatar,
  préférences business (`/users/me/business-preferences`), déconnexion (déjà via `signOut`).
- **Setup payout Stripe Connect** — *le trou critique* : il casse la promesse de la landing
  « encaissez en sécurité ». Exposer `/connect/account`, `/connect/onboarding-link`,
  `/connect/refresh`, l'état du compte Connect, et la méthode de commission
  (`/traveler/commission-method`, `…/setup`, `…/save`).
- **Statut KYC / vérification** : afficher l'état KYC du voyageur, relance si incomplet.

### P1.5 — Grille tarifaire _(quick win remonté, backend prêt)_

- **Éditeur de grille tarifaire** (`/travelers/me/price-grid`) : définir un tarif par
  corridor / tranche de poids, réutilisé/pré-rempli dans le formulaire de nouvelle annonce.

### P2 — Opérationnel quotidien _(backend prêt)_

- **Centre de notifications** (`/notifications`) : inbox des événements (nouveau bid, négo,
  paiement, litige). Web push déjà câblé via `useDeviceRegistration` (`/me/fcm-token`).
- **Messagerie / conversations** (`/conversations` — Epic 11 messagerie) : chat au-delà des
  négociations.
- **Suivi livraison / handover** côté web : exposer le flux tracking voyageur
  (`confirm-presence`, `handover`, `confirm-delivery`, codes de confirmation), adapté au web
  (le scan QR mobile-only est à traiter spécifiquement).
- **Litiges** : ouvrir / suivre un litige (package backend disputes présent).

### P3 — Pilotage & revenus

- **Analytics avancés** : prévisions de remplissage, tendances par corridor, suggestion de
  prix/kg optimal en s'appuyant sur `/market-price` et `/commission-rate`.

### P4 — Acquisition & rétention _(backend prêt)_

- **Profil public partageable** (`/users/{id}/profile-public`, déjà lu en interne côté
  demandes) : page publique du voyageur + lien partageable.
- **Programme de parrainage** (`/me/referral`, `/me/referral/regenerate`, `/referral/redeem`).
- **Abonnements corridor** (`/me/subscriptions`, `/travelers/{id}/subscribe`).
- **Badge Kilo Pro** mis en avant (cockpit / profil).

---

## Prochaines étapes

Chaque phase sera détaillée en spec dédiée puis en plan d'implémentation au moment de la
traiter. Démarrage par **P0 (corrections)** car bloquant, puis **P1 (autonomie)**.

---

## État d'avancement — 2026-05-27 (session autonome)

Implémenté sur la branche `feat/dony-pro-roadmap` (dépôt dony-pro, **non poussée** — PR à faire),
chaque feature avec tests unitaires et couverture globale ≥ 90 % (442 tests verts).

| Phase | Feature | Statut |
|---|---|---|
| P0 | Corrections (tests colis, code mort, vitest, couverture) | ✅ Fait |
| P1 | Page Paramètres + préférences business (`/users/me/business-preferences`) | ✅ Fait — `/parametres` |
| P1 | Statut KYC + lancement Stripe Identity (`/kyc/status`, `/kyc/session`) | ✅ Fait — carte dans `/parametres` |
| P1 | Payout Stripe Connect (`/payments/connect/*`) | ✅ Fait — carte dans `/parametres` ⚠️ round-trip onboarding à vérifier en navigateur (clés test) |
| P1.5 | Grille tarifaire (`/travelers/me/price-grid`) | ✅ Fait — `/tarifs` |
| P2 | Centre de notifications (`/notifications`) | ✅ Fait — `/notifications` |
| P2 | Messagerie — inbox (`/conversations`) | ✅ Fait — `/messages` ⚠️ fil temps réel = Firestore, à brancher (SDK + règles) |
| P2 | Suivi livraison / handover | ⏸️ Différé — mobile-only (QR/GPS/photo) |
| P2 | Litiges | ⏸️ Différé — **aucun endpoint voyageur** côté backend (litiges internes/admin) |
| P3 | Assistant de prix (`/announcements/market-price`, `/config/commission-rate`) | ✅ Fait — `/assistant-prix` |
| P4 | Parrainage (`/me/referral`) | ✅ Fait — `/parrainage` |
| P4 | Profil public + badge Kilo Pro (`/users/{id}/profile-public`) | ✅ Fait — `/mon-profil` (aperçu auth-gated ; lien anonyme public = endpoint public backend à créer) |
| P4 | Abonnements corridor | ⏸️ Différé — sémantique voyageur (« mes abonnés ») non couverte par les endpoints existants |

**À faire ensuite (nécessite décisions / travail hors front dony-pro) :**
1. Pousser `feat/dony-pro-roadmap` et ouvrir la/les PR(s).
2. Vérifier en navigateur les flux de redirection Stripe (Connect onboarding + KYC Identity) avec des clés de test.
3. Fil de messagerie temps réel : intégrer le SDK Firestore + règles de sécurité.
4. Backend : endpoint litiges voyageur + endpoint profil public anonyme + endpoint « mes abonnés » si ces features sont souhaitées.
