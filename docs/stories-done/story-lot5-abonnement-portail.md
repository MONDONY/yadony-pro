# Lot 5 — Parcours d'abonnement dans le portail PRO

**Branche :** `feature/pro-abonnement` (partie d'`origin/main` à `08a5bae`)
**Plan :** `docs/superpowers/plans/2026-08-28-lot5-abonnement-portail.md`
**Journal d'exécution :** `.superpowers/sdd/2026-08-28-lot5-abonnement-portail/` (`progress.md`, `task-1-report.md` à `task-4-report.md`, `final-fix-report.md`)

## Résumé

Le portail devient le **seul canal de paiement** du produit : l'application mobile y renverra pour échapper à l'In-App Purchase Apple. Ce lot livre :

- une page de vente (`/upgrade`) qui présente les deux formules et déclenche le paiement Stripe Checkout ;
- une page de gestion (`/parametres/abonnement`, derrière `pro-only`) qui affiche l'état de l'abonnement et ouvre le Customer Portal Stripe ;
- un bandeau d'alerte global (impayé, ou grâce historique à échéance proche) ;
- un mécanisme de rafraîchissement du profil au retour de Stripe, condition sine qua non pour que le middleware `pro-only` ne renvoie pas un voyageur qui vient de payer vers la page de vente qu'il quitte à peine.

Le lot a été livré en 4 tâches TDD, suivies d'une **revue finale de bout en bout** qui a identifié 4 défauts bloquants invisibles tâche par tâche (voir § 9), corrigés dans une vague unique de 8 correctifs (commit `2628f28`), elle-même stabilisée par un correctif de flakiness e2e (`da015bb`).

Endpoints backend consommés (livrés côté `dony-back`, lots 1 à 4, PR #234) :

| Endpoint | Effet |
|---|---|
| `POST /billing/checkout-session?cycle=MONTHLY\|YEARLY` | Renvoie `{ url }`. 409 si déjà actif, 503 si Stripe non configuré |
| `POST /billing/portal-session` | Renvoie `{ url }` vers le Customer Portal. 404 si aucun client Stripe |
| `GET /billing/subscription` | `{ active, status, source, billingCycle, currentPeriodEnd, cancelAtPeriodEnd, graceExpiresAt }` — toujours 200 |

Statuts : `ACTIVE`, `PAST_DUE`, `LEGACY_GRACE`, `CANCELED`, `EXPIRED`, `NONE`. Tarifs catalogue : 4,99 €/mois ou 47,90 €/an.

---

## Fichiers créés

**Feature `app/features/abonnement/`**

| Fichier | Rôle |
|---|---|
| `types/index.ts` | `BillingCycle`, `SubscriptionStatus`, `SubscriptionSource`, `ProSubscription`, `BillingSessionUrl`, `SUBSCRIPTION_STATUS_LABELS`, `SUBSCRIPTION_PRICING` (tarif catalogue), `BILLING_CYCLE_LABELS` (libellé de périodicité, distinct du tarif) |
| `services/subscriptionService.ts` | `subscriptionService()` → `{ fetchSubscription, createCheckoutSession, createPortalSession }` — appels nus, aucune gestion d'erreur |
| `composables/useSubscription.ts` | `useSubscription()` → état + `fetchSubscription`, `subscribe(cycle)`, `openPortal()` — messages d'erreur français |
| `components/PricingCard.vue` | Une formule (mensuelle ou annuelle), bouton `S'abonner` |
| `components/SubscriptionStatusCard.vue` | État courant de l'abonnement + accès au portail ou lien de souscription |
| `components/SubscriptionBanner.vue` | Bandeau d'alerte impayé / fin de grâce, cliquable vers `/upgrade` |

**Pages**

| Fichier | Rôle |
|---|---|
| `app/pages/parametres/abonnement.vue` | Page de gestion, sous `pro-only` |

**Tests**

- `tests/unit/features/abonnement/{subscriptionService,useSubscription,PricingCard,SubscriptionStatusCard,SubscriptionBanner}.spec.ts`
- `tests/unit/features/landing/LandingFaq.spec.ts` (créé lors des correctifs finaux — le composant n'avait aucun test avant)
- `tests/e2e/abonnement.spec.ts` (368 lignes, 10 scénarios répartis en 8 blocs `describe`)

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `app/pages/upgrade.vue` | Devient la page de vente (était un écran statique « active depuis l'app mobile ») ; ajoute l'état « paiement reçu, activation en cours » |
| `app/stores/auth.ts` | Ajout de l'action `refreshUser()` |
| `app/layouts/default.vue` | Insertion de `SubscriptionBanner`, chargée une fois au montage du layout |
| `app/middleware/pro-only.ts` | Rafraîchissement conditionnel du profil + préservation du paramètre `success=1` en cas de renvoi (**hors de la liste de fichiers du plan initial**, ajouté en tâche 4 — voir § 1) |
| `app/components/layout/AppSidebar.vue` | Entrée « Abonnement » sous « Paramètres », icône `CreditCard`, route `/parametres/abonnement` |
| `app/features/landing/components/LandingAppBridge.vue` | Message « active depuis l'app mobile » → « active en ligne », CTA vers `/upgrade` au lieu d'un lien externe |
| `app/features/landing/components/LandingFaq.vue` | FAQ « Comment accéder à yadony PRO ? » corrigée + nouvelle entrée tarifaire (prix interpolés depuis `SUBSCRIPTION_PRICING`, jamais en dur) |
| `tests/e2e/global-setup.ts` | `/upgrade` et `/parametres/abonnement` ajoutées au préchauffage |
| `tests/unit/middleware/pro-only.spec.ts`, `tests/unit/stores/auth.spec.ts` | Tests étendus |

---

## Comment ça fonctionne

### Découpage en trois couches (et pourquoi)

Strictement respecté sur toute la feature :

- **Service** (`subscriptionService.ts`) : trois appels `api<T>()` nus, aucun `try/catch`. Le paramètre `cycle` du `POST /billing/checkout-session` passe par l'option `query` d'ofetch (jamais `params`, qui n'existe pas dans cette API) — convention vérifiée contre `tripsService.ts`, `bidsService.ts`, `pricingService.ts`.
- **Composable** (`useSubscription.ts`) : porte l'état (`subscription`, `isLoading`, `actionLoading`, `error`) et le `try/catch`. `resolveErrorMessage()` suit le patron de `useTripDetail.publishTrip` : code `ProblemDetail` connu → message français dédié ; sinon `detail` s'il passe le filtre anti-jargon (`TECHNICAL_ERROR_PATTERN`, inspiré de `friendlyAuthError`) ; sinon message générique. **Contrairement à `friendlyAuthError`, il n'y a aucun repli sur `e.message` brut** — écart assumé et validé en revue après un test rouge qui l'a révélé.
- **Composant** : purement présentationnel, props en entrée, événements en sortie (`subscribe`, `manage-portal`), aucun appel réseau.

**`subscribe(cycle)` et `openPortal()` renvoient l'URL Stripe au lieu de naviguer.** C'est le patron déjà utilisé par `useKyc.startVerification()` dans `app/features/kyc/`. Deux bénéfices concrets ici : ces fonctions se testent unitairement sans simuler `window.location` ni `window.open`, et **les deux pages appelantes ne redirigent pas de la même façon** (voir § 6) — si le composable avait navigué lui-même, il aurait fallu un paramètre pour choisir le mode de redirection, ou dupliquer le composable.

### 1. Pourquoi le rafraîchissement du profil vit dans le middleware, pas la page

Le store `auth` (`app/stores/auth.ts`) n'était alimenté par `GET /auth/me` qu'à trois moments : restauration de session au démarrage, connexion par code, rotation du jeton Firebase (qui ne rafraîchit que le jeton, jamais le profil). **Il n'existait aucune action de rafraîchissement** avant ce lot.

Le plan initial (tâche 4) prévoyait de détecter `?success=1` et d'appeler `refreshUser()` dans l'`onMounted` de `app/pages/parametres/abonnement.vue`. **Ça ne peut pas marcher** : `defineNuxtRouteMiddleware` (`app/middleware/pro-only.ts`) s'exécute côté client **avant** le montage de la page, et peut rediriger. Si `auth.isProAccount` est encore périmé à cet instant (webhook Stripe pas encore traité par le backend), le middleware renvoie vers `/upgrade` et la page de gestion — avec son `onMounted` réparateur — **ne se monte jamais**. Le rafraîchissement placé dans la page aurait été du code mort dans le scénario même qu'il devait couvrir.

L'implémentation (déviation signalée et validée en revue) déplace donc le rafraîchissement décisif dans `pro-only.ts` :

```ts
// app/middleware/pro-only.ts
if (to?.query?.success === '1' && !auth.isProAccount) {
  await auth.refreshUser()
}
if (!auth.isProAccount) {
  if (to?.query?.success === '1') {
    return navigateTo({ path: '/upgrade', query: { success: '1' } })
  }
  return navigateTo('/upgrade')
}
```

Points à retenir :
- **Strictement conditionnel** à `success=1 && !isProAccount` — jamais déclenché à chaque navigation. Un voyageur déjà PRO, ou naviguant sans ce paramètre, ne déclenche aucun appel réseau supplémentaire.
- **Asynchrone en signature seulement** : dans le cas courant (pas de `success=1`, ou déjà PRO), aucune attente n'est introduite — la fonction retourne aussi vite qu'avant.
- La page de gestion garde **aussi** son propre `refreshUser()` sur `?success=1` dans son `onMounted` (avec la même garde `!auth.isProAccount`, ajoutée en correctif pour ne pas doubler l'appel réseau du middleware). C'est de la défense en profondeur : elle couvre une arrivée par navigation interne sans repasser par le middleware.

### 2. Le middleware préserve `success=1` en redirigeant

Stripe redirige **toujours** vers `/parametres/abonnement?success=1` (paramètre confirmé côté backend, `yadony.billing.success-url`), jamais directement vers `/upgrade`. Si le webhook Stripe n'a toujours pas atterri après le rafraîchissement du middleware, celui-ci renvoie vers `/upgrade` — mais sans transporter le paramètre, l'état « paiement reçu, activation en cours » de la page de vente serait **indéclenchable dans le vrai parcours** : `upgrade.vue` ne saurait jamais qu'un paiement vient d'avoir lieu. D'où :

```ts
if (to?.query?.success === '1') {
  return navigateTo({ path: '/upgrade', query: { success: '1' } })
}
```

Testé en e2e par un chemin complet (`page.goto('/parametres/abonnement?success=1')`, pas un raccourci de composant) qui vérifie que l'URL finit bien sur `/upgrade?success=1` avec l'état d'attente visible, quand le rafraîchissement échoue à confirmer le statut PRO.

### 3. Le cul-de-sac que ce lot ferme

Avant correction (défaut B2 de la revue finale) : si le webhook tardait, l'utilisateur débité revenait sur `/parametres/abonnement?success=1`, le middleware le renvoyait aux tarifs **sans un mot** (aucun `success=1` transporté). Il recliquait « S'abonner », recevait un 409 (`subscription-already-active`, un abonnement Stripe existe déjà côté backend même si le front l'ignore encore), dont le message renvoyait vers « la page de gestion de votre abonnement » — qui le renvoyait de nouveau aux tarifs. **Boucle fermée juste après un débit.**

La correction combine le § 2 (le paramètre survit) et un nouvel état dans `app/pages/upgrade.vue` : `paymentSucceeded` (dérivé de `route.query.success === '1'`) remplace la grille tarifaire par un écran « Paiement reçu, activation en cours » avec un bouton « Vérifier à nouveau » (`onCheckActivation`, rejoue `refreshUser()` puis redirige vers `/parametres/abonnement` si `isProAccount` bascule à vrai). Une tentative automatique a aussi lieu au montage.

### 4. Un échec de rafraîchissement ne doit jamais vider la session

`app/stores/auth.ts` :

```ts
async refreshUser() {
  if (!this.idToken) return
  try {
    const api = useApi()
    const user = await api<AuthUser>('/auth/me')
    this.user = user
  } catch {
    // Un échec de rafraîchissement ne doit jamais vider la session existante.
  }
},
```

Un échec réseau sur `/auth/me` (au retour de Stripe, moment particulièrement exposé aux aléas réseau) est absorbé silencieusement : `idToken` et `user` restent inchangés. Testé explicitement dans `tests/unit/stores/auth.spec.ts` — le test asserte que jeton **et** profil restent strictement identiques après un rejet simulé du service, un test qualifié de « discriminant » en revue : il casserait si le code appelait `clear()` ou écrasait `user` avec `null` en cas d'erreur.

### 5. Redirection : onglet courant pour le paiement, nouvel onglet pour le KYC

`window.location.href` (onglet courant) dans `upgrade.vue` (`onSubscribe`) et `parametres/abonnement.vue` (`onManagePortal`) — jamais `window.open`. Divergence assumée avec `onVerifyKyc`/`onSetupPayout` de `parametres/index.vue`, qui ouvrent un nouvel onglet : le parcours de paiement Stripe **se termine par un retour sur le portail** (`success_url` pointe vers le portail lui-même), alors que la vérification d'identité Stripe Identity n'y revient jamais. Un nouvel onglet pour le paiement laisserait un onglet orphelin sur une page périmée après redirection.

### 6. Bouton de gestion masqué selon la source de l'abonnement

`SubscriptionStatusCard.vue` :

```ts
const hasStripeCustomer = computed(() => props.subscription?.source === 'STRIPE')
```

Le DTO exposé au client (`ProSubscription`) ne porte **délibérément aucun identifiant Stripe** ; le front ne peut donc pas savoir directement si un `stripeCustomerId` existe côté backend. `source === 'STRIPE'` est le meilleur indicateur disponible, et c'est le vocabulaire déjà utilisé par le message d'erreur `no-stripe-customer` du composable.

**Cas limite assumé :** depuis le lot 3 backend, `stripeCustomerId` survit à un changement de `source` — un compte passé d'un abonnement payant (`STRIPE`) à un accès offert (`ADMIN_GRANT`) garde un client Stripe en base mais voit le bouton de gestion **masqué** côté portail (et un lien « S'abonner » à la place, voir § 9). Sans conséquence : son accès actuel n'étant pas payant, le Customer Portal ne lui servirait à rien. Le message `no-stripe-customer` reste le filet si le cas se présentait autrement.

### 7. La borne du bandeau : grâce restante ≤ 7 jours

`SubscriptionBanner.vue` calcule les jours restants en **jours calendaires** (dates tronquées à minuit local, pas en millisecondes écoulées) :

```ts
function calendarDaysUntil(iso: string): number {
  const target = new Date(iso)
  const now = new Date()
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  // Math.round est NÉCESSAIRE : les dates étant tronquées à minuit LOCAL, un
  // changement d'heure (DST) donne 23h ou 25h d'écart réel, une division nue
  // produirait 6,96 ou 7,04 au lieu de 7 pile.
  return Math.round((startOfTarget.getTime() - startOfNow.getTime()) / DAY_MS)
}
```

**Ne pas retirer le `Math.round`** : il a été signalé à tort comme superflu dans un point différé de la tâche 3, puis explicitement confirmé nécessaire en revue finale et documenté par un commentaire dans le code lui-même.

Le bandeau s'affiche pour `graceDaysRemaining` compris entre `0` et `7` **inclus** (`<= 7`, pas `< 7`) — arbitrage tranché en faveur de l'instruction de test explicite du brief plutôt que de sa formulation en prose ambiguë (« moins de sept jours »), au motif qu'avertir une semaine pleine avant est plus utile que se taire ce jour-là. Le libellé distingue trois cas naturels en français : `0` → « aujourd'hui », `1` → « demain », `N ≥ 2` → « dans N jours » (jamais « dans 0 jour(s) », grammaticalement invalide). Une grâce déjà expirée (jours négatifs) reste invisible, protégée par la garde `>= 0`, testée explicitement.

### 8. Ce que la revue finale a rattrapé

Une revue de bout en bout (arrivée → paiement → retour → impayé un mois plus tard → résiliation), menée après les 4 tâches individuellement approuvées, a trouvé 4 défauts **invisibles tâche par tâche** :

- **B1 — aucun écran authentifié ne menait à `/upgrade`.** Le bandeau disait « Abonnez-vous » sans rien à cliquer ; un compte en grâce historique (la cible même du bandeau) n'avait physiquement aucun moyen de payer depuis le portail. Corrigé en rendant `SubscriptionBanner` cliquable (`<NuxtLink to="/upgrade">` sur les deux tons) et en ajoutant un lien `S'abonner` sur `SubscriptionStatusCard` quand `source !== 'STRIPE'`.
- **B2 — boucle fermée sur webhook tardif**, décrite au § 3.
- **B3 — la page de gestion affirmait « Aucun abonnement » sur un échec réseau**, à un utilisateur nécessairement PRO puisque la page est derrière `pro-only`. Corrigé par une branche `v-else-if="error && !subscription"` dans `abonnement.vue` qui empêche `SubscriptionStatusCard` de se monter sur échec initial, et affiche un bouton « Réessayer » à la place.
- **B4 — le cycle affiché était le tarif du catalogue courant**, pas ce que paie réellement un abonné historique ou promotionnel. Corrigé par `BILLING_CYCLE_LABELS` (« Mensuel »/« Annuel », sans montant), distinct de `SUBSCRIPTION_PRICING` qui reste réservé à `PricingCard` sur `/upgrade`.

Trouvaille annexe : la phrase d'économie annuelle de `PricingCard` annonçait « 2 mois offerts » en dur alors que 11,98 € d'économie représentent 2,4 mois au tarif catalogue — deux chiffres contradictoires dans la même phrase. Le nombre de mois est désormais **dérivé** (`savings / MONTHLY.amount`), jamais écrit en dur.

Deux textes publics faux ont aussi été corrigés hors du périmètre initial des 4 tâches, découverts en suivant le parcours d'un prospect non connecté : `LandingAppBridge.vue` et `LandingFaq.vue` répétaient « active depuis l'application mobile », vus **avant** `/upgrade` — plus grave que le même texte sur `/upgrade` (déjà corrigé en tâche 4), car un prospect qui les lit part chercher une fonctionnalité inexistante dans l'app.

### 9. Point de vigilance au déploiement

`app.baseURL` vaut `/pro/` dans `nuxt.config.ts`. La page de gestion est en `/parametres/abonnement` (chemin par défaut attendu côté backend), mais les URL de retour Stripe configurées côté backend (`yadony.billing.success-url` et consorts, dans `dony-back`) doivent **inclure le préfixe `/pro/`**, sans quoi le retour de Checkout n'atterrit pas sur la bonne route. **À vérifier explicitement avant d'ouvrir le paiement en production** — ce point n'a pas pu être vérifié depuis ce dépôt, la configuration réelle vivant dans `dony-back`.

---

## Décisions techniques (résumé)

| Décision | Raison |
|---|---|
| Feature nommée `abonnement`, jamais `pricing` | `app/features/pricing/` existe déjà (assistant de prix au kilo) |
| `query` (ofetch) pour le paramètre `cycle` du `POST /billing/checkout-session`, jamais `params` | `params` n'existe pas dans l'API ofetch utilisée par `useApi()` ; vérifié contre 3 services existants |
| `resolveErrorMessage` ne retombe jamais sur `e.message` brut | Divergence volontaire avec `friendlyAuthError` — suit `useTripDetail.publishTrip` à la lettre, revue confirmée par vérification backend que les 3 codes priment sur `detail` |
| Type `SubscriptionSource` = `'STRIPE' \| 'ADMIN_GRANT' \| 'LEGACY_FREE'` | Resserré depuis `string \| null` en correctif de revue, consommé par `SubscriptionStatusCard` |
| `BillingSessionUrl` (renommé depuis `CheckoutUrl`) | Le type est partagé par checkout et portail, un nom lié au seul checkout était trompeur |
| Bandeau sans emit, purement informatif (sauf le lien global vers `/upgrade`) | À la différence de `NegotiationLinkedTripBanner`, qui est un bouton de navigation dédié |
| Message `billing-not-configured` = « L'abonnement n'est pas encore ouvert. » | Le texte initial (« Réessayez plus tard ») laissait croire qu'attendre résoudrait une configuration serveur absente |

---

## Tests

**Unitaires (Vitest) :** 767 tests, tous verts, répartis sur 120 fichiers.

**Bout en bout (Playwright) :** 32 tests, tous verts (10 scénarios dans `tests/e2e/abonnement.spec.ts`, répartis en 8 blocs `describe` : voyageur PRO, page de gestion en échec réseau, voyageur en impayé, voyageur non-PRO sur la page de vente, retour de paiement Stripe — régression middleware, visiteur non connecté, retour de paiement avec webhook en retard).

**Couverture globale (`pnpm test:coverage`, exit code 0) :**

| Métrique | Résultat | Seuil |
|---|---|---|
| Statements | 92,59 % (2576/2782) | 90 % |
| Branches | 86,43 % (1707/1975) | 84 % |
| Functions | 90,54 % (737/814) | 90 % |
| Lines | 94,02 % (2393/2545) | 90 % |

**Feature `app/features/abonnement/components` :** 98,55 % / 98,33 % / 100 % / 100 %.

`app/middleware/pro-only.ts` : 88,88/90/100/100 — seule ligne non couverte : `if (import.meta.server) return`, préexistante, non testable en environnement Vitest (le client testé a toujours `import.meta.server === false`).

`app/pages/upgrade.vue`, `app/pages/parametres/abonnement.vue`, `app/layouts/default.vue`, `AppSidebar.vue` : comme le reste des pages/layouts du dépôt, non instrumentés par Vitest (`coverage.all` désactivé) — leur couverture réelle vient exclusivement des tests e2e ci-dessus.

`LandingFaq.vue` : 81,81/62,5/50/81,81 — sous les seuils individuellement, mais le projet n'applique le seuil qu'à l'agrégat global (`vitest.config.ts` ne déclare pas `perFile`).

Un piège de test notable : le premier jet de `abonnement.spec.ts` cliquait sur « S'abonner » juste après `page.goto('/upgrade')`, en s'appuyant sur la visibilité du contenu SSR comme signal de « page prête ». Le contenu est déjà rendu côté serveur avant l'hydratation Vue : le clic Playwright résolvait en 63 ms sur du DOM pré-hydratation, sans que le gestionnaire `@click` soit encore attaché — clic « mort », aucune requête ni navigation. Fix : `await page.waitForLoadState('networkidle')` avant tout clic sur `/upgrade` (repris du patron `gotoNouvelleAnnonce()` de `trajets.spec.ts`). Un flake similaire est apparu plus tard sur le bouton « Vérifier à nouveau » (assertion évaluée avant que le clic n'ait eu le temps de déclencher son appel réseau), corrigé en commit `da015bb` par `page.waitForRequest('**/auth/me')` armé avant le clic.

---

## Reste à faire

- **Vérifier au déploiement** que les URL de retour Stripe configurées côté `dony-back` intègrent le préfixe `/pro/` (§ 9) — non vérifiable depuis ce dépôt.
- `pnpm lint` : aucun script `lint` n'existe dans `package.json` de ce dépôt (seuls `test`, `test:watch`, `test:coverage`, `e2e`, `e2e:ui`, `build`, `dev`, `generate`, `preview`). L'invocation directe d'`eslint` échoue de façon repo-wide, y compris sur des fichiers non touchés par ce lot, pour deux raisons sans rapport avec ce travail : un `.claude/worktrees/migration-vps-staging-prod/` parasite dont la config ESLint pointe vers un `.nuxt/eslint.config.mjs` jamais généré dans ce worktree, et une résolution de flat-config incohérente sous le proxy RTK. Non traité, hors périmètre — un script `lint` fiable reste à établir dans un autre lot.
- Le couplage implicite entre le paramètre `success=1` (utilisé par `pro-only.ts` et `upgrade.vue`) et sa définition côté `dony-back` (`yadony.billing.success-url`) n'est vérifié que manuellement, dans un dépôt séparé (mémoire : « Repo layout 2 git repos » — cross-stack = 2 PRs). Un changement de ce paramètre côté backend sans synchronisation ferait cesser silencieusement le rafraîchissement préventif (le middleware redirigerait quand même vers `/upgrade`, juste sans tentative de rafraîchissement préalable — dégradation silencieuse, pas une régression bruyante).
- Hors périmètre assumé (plan) : historique de facturation (délégué au Customer Portal Stripe), changement de formule en cours d'abonnement (idem, un seul palier existe), correction du message de `WalletCard` sur la recharge de portefeuille par carte (toujours valable, seul le message d'abonnement était faux), lot 6 (application mobile qui renverra vers ce portail).

## Points que je n'aurais pas pu documenter sans les sources fournies

Aucun — le plan, le journal `progress.md`, les 4 rapports de tâche et `final-fix-report.md` couvrent l'intégralité des décisions et écarts nécessaires ; tout ce qui figure ci-dessus a été vérifié contre le code réel des fichiers cités.
