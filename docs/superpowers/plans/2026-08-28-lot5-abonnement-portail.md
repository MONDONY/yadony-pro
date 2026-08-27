# Lot 5 — Parcours d'abonnement dans le portail PRO — Plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE — utiliser `superpowers:subagent-driven-development`. Les étapes utilisent la syntaxe case à cocher (`- [ ]`).

**Objectif :** permettre à un voyageur de souscrire l'abonnement PRO et de le gérer depuis le portail web, seul canal de paiement du produit.

**Contexte :** les lots 1 à 4, livrés côté `dony-back`, exposent trois endpoints que ce lot consomme. Le paiement est **web uniquement** — l'application mobile renverra ici, pour échapper à l'In-App Purchase Apple.

**Stack :** Nuxt 4, TypeScript strict, TailwindCSS, kit UI maison inspiré shadcn-vue, Pinia, Vitest + Playwright.

**Dépôt :** `dony-pro`, branche `feature/pro-abonnement`, partie d'`origin/main`.

## Les endpoints du backend

| Endpoint | Effet |
|---|---|
| `POST /billing/checkout-session?cycle=MONTHLY\|YEARLY` | Renvoie `{ url }`, à ouvrir pour payer. **409** si un abonnement est déjà actif, **503** si Stripe n'est pas configuré |
| `POST /billing/portal-session` | Renvoie `{ url }` vers le Customer Portal. **404** si aucun client Stripe n'est rattaché |
| `GET /billing/subscription` | `{ active, status, source, billingCycle, currentPeriodEnd, cancelAtPeriodEnd, graceExpiresAt }`. Répond toujours 200 ; sans abonnement, `status` vaut `"NONE"` et `active` est faux |

Statuts possibles : `ACTIVE`, `PAST_DUE`, `LEGACY_GRACE`, `CANCELED`, `EXPIRED`, `NONE`. Les trois premiers ouvrent l'accès PRO.

Tarifs : **4,99 € par mois** ou **47,90 € par an**, soit deux mois offerts.

## Contraintes globales

- TypeScript strict. Pas de `any`, pas de `@ts-ignore`.
- Structure d'une feature, invariable sur les 27 existantes : `components/` + `composables/` + `services/` + `types/index.ts`. **Aucune feature ne contient de `pages/`** — les pages vivent dans `app/pages/` et importent la feature.
- Découpage en trois couches, strict : le **service** ne fait que l'appel `api<T>()` sans aucune gestion d'erreur ; le **composable** porte l'état, le `try/catch` et les messages en français ; le **composant** est présentationnel, props en entrée, événements en sortie.
- Erreurs backend : lire le `ProblemDetail` avec `extractProblem(e)` de `@/lib/apiError`, mapper le `code` vers un message français, retomber sur `detail`, puis sur un message générique. Le patron canonique est dans `app/features/trajets/composables/useTripDetail.ts`.
- Tout élément lisant le store `auth` doit être enveloppé dans `<ClientOnly>` : le store est en mémoire seule, non hydraté côté serveur.
- `data-test="..."` sur tout élément qu'un test doit atteindre.
- Icônes **lucide en trait, jamais d'emoji**. Titres en `font-display`. Chiffres en `font-mono tabular-nums`.
- Seuils de couverture Vitest : **lignes, fonctions et instructions à 90 %, branches à 84 %**. `app/components/ui/**` en est exclu.
- Ne jamais lancer deux commandes de build ou de test en parallèle.

### Deux pièges de nommage à connaître

**`app/features/pricing/` existe déjà** et n'a rien à voir : c'est l'assistant de prix de transport au kilo. **Ne pas nommer la nouvelle feature `pricing`.** Elle s'appellera `abonnement`.

**`app.baseURL` vaut `/pro/`** dans `nuxt.config.ts`. Les URL de retour configurées côté backend — `YADONY_BILLING_SUCCESS_URL` et consorts — doivent en tenir compte. Ce plan place la page de gestion à la route `/parametres/abonnement`, ce qui correspond au chemin par défaut du backend ; **vérifier au déploiement** que le préfixe `/pro/` est bien pris en compte dans les valeurs réellement configurées.

### Le patron de redirection Stripe existe déjà

`app/features/kyc/` fait exactement ce qu'il faut faire ici : un `POST` qui renvoie une URL hébergée par Stripe, puis une ouverture de fenêtre. À copier, sans réinventer.

```ts
async function onVerifyKyc() {
  const url = await startKycVerification()
  if (url && import.meta.client) {
    window.open(url, '_blank', 'noopener')
  }
}
```

Pour le paiement, préférer une **redirection dans l'onglet courant** (`window.location.href`) plutôt qu'un nouvel onglet : le parcours Checkout se termine par un retour sur le portail, et un onglet orphelin laisserait l'utilisateur devant une page périmée.

---

## Structure des fichiers

**Créés :**

| Fichier | Responsabilité |
|---|---|
| `app/features/abonnement/types/index.ts` | Types de l'abonnement, libellés des statuts, tarifs |
| `app/features/abonnement/services/subscriptionService.ts` | Les trois appels API, sans gestion d'erreur |
| `app/features/abonnement/composables/useSubscription.ts` | État, erreurs, messages français |
| `app/features/abonnement/components/PricingCard.vue` | Une formule, mensuelle ou annuelle |
| `app/features/abonnement/components/SubscriptionStatusCard.vue` | État courant de l'abonnement |
| `app/features/abonnement/components/SubscriptionBanner.vue` | Bandeau d'alerte impayé ou fin de grâce |
| `app/pages/parametres/abonnement.vue` | Page de gestion |

**Modifiés :**

| Fichier | Changement |
|---|---|
| `app/pages/upgrade.vue` | Devient la page de vente |
| `app/stores/auth.ts` | Ajout d'une action de rafraîchissement du profil |
| `app/layouts/default.vue` | Insertion du bandeau global |

---

## Task 1 : Types, service et rafraîchissement du profil

**Fichiers :**
- Créer : `app/features/abonnement/types/index.ts`
- Créer : `app/features/abonnement/services/subscriptionService.ts`
- Modifier : `app/stores/auth.ts`
- Test : `tests/unit/features/abonnement/subscriptionService.spec.ts`
- Test : `tests/unit/stores/auth.spec.ts` — créer si absent

**Interfaces produites :**
- `ProSubscription`, `BillingCycle`, `SubscriptionStatus`, `CheckoutUrl`
- `subscriptionService()` → `{ fetchSubscription, createCheckoutSession, createPortalSession }`
- `useAuthStore().refreshUser()`

### Pourquoi le rafraîchissement du profil est indispensable

Le store `auth` est alimenté par `GET /auth/me` à trois moments seulement : restauration de session au démarrage, connexion par code, et rotation du jeton Firebase — cette dernière ne rafraîchissant que le jeton, jamais le profil.

**Il n'existe aucune action de rafraîchissement.** Sans elle, un voyageur qui revient de Stripe après avoir payé verrait `isProAccount` rester à `false`, et le middleware `pro-only` le renverrait vers la page de vente qu'il vient de quitter. Le rafraîchissement doit donc exister avant tout le reste.

- [ ] **Étape 1 : Écrire le test du service**

`tests/unit/features/abonnement/subscriptionService.spec.ts`, calqué sur `tests/unit/features/parametres/businessPrefsService.spec.ts` — même mock de `@/composables/useApi`, même idiome `vi.resetModules()` puis `await import(...)` dans chaque cas, rendu nécessaire par le singleton d'instance API.

Trois cas : `fetchSubscription` appelle `GET /billing/subscription` ; `createCheckoutSession` appelle `POST /billing/checkout-session` en transmettant le cycle demandé ; `createPortalSession` appelle `POST /billing/portal-session`.

Asserter l'URL, la méthode et les paramètres **exacts** — c'est le seul endroit où le contrat avec le backend est vérifié.

- [ ] **Étape 2 : Lancer le test et vérifier qu'il échoue**

Commande : `pnpm test -- subscriptionService`
Attendu : ÉCHEC, le module n'existe pas.

- [ ] **Étape 3 : Écrire les types**

`app/features/abonnement/types/index.ts` : les types de la réponse `GET /billing/subscription`, le type du cycle, les libellés français de chaque statut, et les deux tarifs sous forme de constantes — montant, devise et libellé, pour qu'aucun prix ne soit écrit en dur dans un composant.

Prévoir un libellé pour `NONE`, que le backend renvoie quand aucun abonnement n'existe.

- [ ] **Étape 4 : Écrire le service**

`app/features/abonnement/services/subscriptionService.ts`, sur le modèle exact de `businessPrefsService` : une fonction fabrique, `useApi()` en tête, et trois appels nus. **Aucun `try`, aucun message** — c'est le rôle du composable.

- [ ] **Étape 5 : Ajouter le rafraîchissement du profil**

Dans `app/stores/auth.ts`, ajouter une action asynchrone qui appelle `GET /auth/me`, met à jour `user` en conservant le jeton courant, et ne fait rien si aucun jeton n'est présent.

Écrire le test correspondant : le profil est bien remplacé après appel, et un échec de l'appel ne vide pas la session — perdre la session parce qu'un rafraîchissement a échoué serait pire que ne pas rafraîchir.

- [ ] **Étape 6 : Relancer les tests**

Commande : `pnpm test -- subscriptionService auth`
Attendu : SUCCÈS.

- [ ] **Étape 7 : Commit**

```bash
git add app/features/abonnement app/stores/auth.ts tests/unit
git commit -m "feat(abonnement): service d'abonnement et rafraîchissement du profil"
```

---

## Task 2 : Composable et messages d'erreur

**Fichiers :**
- Créer : `app/features/abonnement/composables/useSubscription.ts`
- Test : `tests/unit/features/abonnement/useSubscription.spec.ts`

**Interfaces :**
- Consomme : `subscriptionService()`, `extractProblem` de `@/lib/apiError`
- Produit : `useSubscription()` → état et actions

### Les trois erreurs backend à traduire

| Code | Situation | Message attendu |
|---|---|---|
| `subscription-already-active` | 409 sur la souscription | Dire que l'abonnement est déjà en cours et orienter vers la gestion |
| `billing-not-configured` | 503, Stripe pas encore configuré | Dire que l'abonnement n'est pas encore disponible, sans jargon technique |
| `no-stripe-customer` | 404 sur le portail | Dire qu'aucun abonnement payant n'est rattaché au compte |

Suivre le patron de `useTripDetail` : mapper le code, retomber sur `detail`, puis sur un message générique. Ne jamais afficher un message technique brut à l'utilisateur — `friendlyAuthError` montre comment les filtrer.

- [ ] **Étape 1 : Écrire le test**

`tests/unit/features/abonnement/useSubscription.spec.ts`, calqué sur `useBusinessPreferences.spec.ts` : le **service** est mocké, pas `useApi`.

Couvrir : le chargement de l'abonnement et son état intermédiaire de chargement ; la souscription renvoyant une URL ; chacun des trois codes d'erreur produisant son message français ; une erreur sans code connu retombant sur le message générique.

Pour l'état de chargement, suivre l'idiome du dépôt : appeler sans attendre, asserter que le drapeau est vrai, puis attendre.

- [ ] **Étape 2 : Lancer le test et vérifier qu'il échoue**

Commande : `pnpm test -- useSubscription`
Attendu : ÉCHEC, le module n'existe pas.

- [ ] **Étape 3 : Écrire le composable**

`app/features/abonnement/composables/useSubscription.ts` : références d'état pour l'abonnement, le chargement, l'action en cours et l'erreur ; une fonction de chargement, une de souscription renvoyant l'URL ou `null`, une d'ouverture du portail.

Les fonctions qui renvoient une URL ne doivent **pas** naviguer elles-mêmes : c'est la page qui décide, comme le fait `onVerifyKyc`. Cela les rend testables sans simuler la navigation.

- [ ] **Étape 4 : Relancer le test**

Commande : `pnpm test -- useSubscription`
Attendu : SUCCÈS.

- [ ] **Étape 5 : Commit**

```bash
git add app/features/abonnement/composables tests/unit/features/abonnement/useSubscription.spec.ts
git commit -m "feat(abonnement): composable d'abonnement et messages d'erreur"
```

---

## Task 3 : Composants de présentation

**Fichiers :**
- Créer : `app/features/abonnement/components/PricingCard.vue`
- Créer : `app/features/abonnement/components/SubscriptionStatusCard.vue`
- Créer : `app/features/abonnement/components/SubscriptionBanner.vue`
- Test : `tests/unit/features/abonnement/PricingCard.spec.ts`
- Test : `tests/unit/features/abonnement/SubscriptionStatusCard.spec.ts`
- Test : `tests/unit/features/abonnement/SubscriptionBanner.spec.ts`

Les trois composants sont **purement présentationnels** : props en entrée, événements en sortie, aucun appel API. Ils se testent donc par `mount` sans rien simuler, comme `ProfileInfoCard.spec.ts`.

### Ce que chacun doit montrer

**`PricingCard`** présente une formule : son libellé, son prix, et pour l'annuelle l'économie réalisée — deux mois offerts. Elle porte un bouton qui émet un événement, et accepte un état de chargement et un état « mise en avant » pour distinguer visuellement la formule annuelle.

**`SubscriptionStatusCard`** montre l'état courant : le libellé français du statut, le cycle s'il existe, la date d'échéance, et une mention de résiliation programmée le cas échéant. Elle porte le bouton d'accès au portail, qu'elle **masque** quand aucun abonnement payant n'est rattaché — proposer de gérer un abonnement inexistant mènerait à une erreur.

**`SubscriptionBanner`** est le bandeau d'alerte. Il n'existe **aucun composant de bandeau ou d'alerte générique** dans ce dépôt : le plus proche visuellement est `NegotiationLinkedTripBanner`, dont la formule est `rounded-el border border-<ton>/30 bg-<ton>/5` avec une icône lucide `text-<ton>`, le ton étant `primary`, `success`, `warning` ou `danger`.

Le bandeau ne s'affiche que dans deux situations, et rien d'autre : un impayé, en ton `danger` ; une grâce historique arrivant à échéance dans moins de sept jours, en ton `warning` avec le nombre de jours restants. Dans tous les autres cas il ne rend rien.

- [ ] **Étape 1 : Écrire les tests des trois composants**

Un fichier par composant, sur le modèle de `ProfileInfoCard.spec.ts` : `mount` avec des props, assertions sur des sélecteurs `data-test`.

Couvrir en particulier les cas où un élément doit être **absent** : le bouton du portail quand aucun client Stripe n'est rattaché, et le bandeau dans tous les statuts qui ne le justifient pas. Un composant qui affiche toujours quelque chose est plus facile à tester par erreur qu'un composant qui sait se taire.

Pour le bandeau, tester les bornes : une grâce à sept jours et une à huit jours ne doivent pas produire le même résultat.

- [ ] **Étape 2 : Lancer les tests et vérifier qu'ils échouent**

Commande : `pnpm test -- PricingCard SubscriptionStatusCard SubscriptionBanner`
Attendu : ÉCHEC, les composants n'existent pas.

- [ ] **Étape 3 : Écrire les trois composants**

Suivre les conventions visuelles du dépôt : surfaces en `bg-surface border border-border rounded-card p-5`, titres en `font-display`, montants en `font-mono tabular-nums`, boutons via `@/components/ui/button`, icônes `lucide-vue-next`.

- [ ] **Étape 4 : Relancer les tests**

Commande : `pnpm test -- PricingCard SubscriptionStatusCard SubscriptionBanner`
Attendu : SUCCÈS.

- [ ] **Étape 5 : Commit**

```bash
git add app/features/abonnement/components tests/unit/features/abonnement
git commit -m "feat(abonnement): composants de tarif, statut et alerte"
```

---

## Task 4 : Pages et bandeau global

**Fichiers :**
- Modifier : `app/pages/upgrade.vue`
- Créer : `app/pages/parametres/abonnement.vue`
- Modifier : `app/layouts/default.vue`
- Test : `tests/e2e/abonnement.spec.ts`

### La page de vente

`app/pages/upgrade.vue` est aujourd'hui un écran statique disant « demande l'activation depuis l'application mobile ». Ce message est **devenu faux** : c'est désormais ici que l'on s'abonne.

Elle conserve le layout `auth` — un voyageur non-PRO n'a pas accès à la barre latérale, et c'est la cible du middleware `pro-only`. Elle présente les deux formules et déclenche la souscription.

Elle reste une route publique, déclarée dans `auth.global.ts`. Un visiteur non authentifié doit donc y voir les tarifs, mais être renvoyé vers la connexion s'il tente de souscrire — on ne peut pas rattacher un paiement à un compte inconnu.

### La page de gestion

`app/pages/parametres/abonnement.vue`, sous le middleware `pro-only`, avec `pageTitle` et `pageSubtitle` via `definePageMeta`, calquée sur `app/pages/parametres/index.vue`.

Elle affiche l'état de l'abonnement et donne accès au Customer Portal. Au retour de Stripe avec le paramètre de succès, elle doit **rafraîchir le profil** avant toute chose — sinon le middleware la juge non-PRO et la renvoie vers la page de vente.

Ajouter une entrée vers cette page dans la barre latérale, auprès des paramètres.

### Le bandeau global

Dans `app/layouts/default.vue`, entre la barre supérieure et le contenu principal. Il charge l'abonnement une fois et ne rend rien tant qu'il n'y a pas lieu d'alerter.

- [ ] **Étape 1 : Transformer la page de vente**

Remplacer le contenu de `app/pages/upgrade.vue` par les deux formules. Le bouton déclenche la souscription et redirige vers l'URL renvoyée, dans l'onglet courant.

Afficher l'erreur du composable si la souscription échoue — en particulier le cas « pas encore disponible », que l'utilisateur doit comprendre sans jargon.

- [ ] **Étape 2 : Écrire la page de gestion**

Créer `app/pages/parametres/abonnement.vue` et son entrée de navigation.

- [ ] **Étape 3 : Insérer le bandeau**

Modifier `app/layouts/default.vue`.

- [ ] **Étape 4 : Écrire le test de bout en bout**

`tests/e2e/abonnement.spec.ts`, sur le modèle de `tests/e2e/trajets.spec.ts` : amorçage de session par `addInitScript`, blocage des appels Firebase, et simulation des routes API par `page.route().fulfill()`.

Couvrir trois parcours : un voyageur PRO voit l'état de son abonnement ; un voyageur en impayé voit le bandeau d'alerte ; un voyageur non-PRO arrivant sur la page de vente voit les deux formules et peut déclencher la souscription — en interceptant l'appel pour vérifier qu'il part, sans suivre la redirection vers Stripe.

Ajouter les nouvelles routes à la liste de préchauffage de `tests/e2e/global-setup.ts`, sans quoi le premier chargement dépasse parfois le délai d'attente.

- [ ] **Étape 5 : Lancer les tests**

Commande : `pnpm test`
Puis : `pnpm e2e`
Attendu : SUCCÈS des deux. Rapporter le résultat réel, y compris en cas d'échec.

- [ ] **Étape 6 : Vérifier la couverture**

Commande : `pnpm test:coverage`
Seuils : lignes, fonctions et instructions à 90 %, branches à 84 %. Rapporter les chiffres réels par fichier de la feature.

- [ ] **Étape 7 : Commit**

```bash
git add app/pages app/layouts tests/e2e
git commit -m "feat(abonnement): page de vente, page de gestion et bandeau d'alerte"
```

---

## Vérification de fin de lot

- [ ] `pnpm test` et `pnpm e2e` passent
- [ ] Couverture au-dessus des seuils, vérifiée par fichier
- [ ] `pnpm lint` passe
- [ ] Aucun prix écrit en dur dans un composant : tous viennent des constantes de `types/index.ts`
- [ ] Le profil est rafraîchi au retour de paiement, et le middleware ne renvoie plus vers la page de vente
- [ ] Le bandeau ne s'affiche que sur impayé ou fin de grâce proche
- [ ] Aucun message technique brut affiché à l'utilisateur

## Hors périmètre

- Lot 6, l'application mobile, qui renverra vers ce portail
- L'affichage de l'historique de facturation : le Customer Portail de Stripe s'en charge
- Le changement de formule en cours d'abonnement : le Customer Portal également, et il n'y a qu'un palier
- La correction du message de `WalletCard` déléguant le paiement par carte au mobile, désormais inexact pour l'abonnement mais toujours valable pour la recharge du portefeuille
