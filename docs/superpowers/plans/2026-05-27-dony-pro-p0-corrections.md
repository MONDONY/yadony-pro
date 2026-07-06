# dony-pro P0 — Corrections & versioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Amener dony-pro à un état propre et vert (tests, config, code mort), puis créer le commit inaugural qui versionne enfin le portail dans git.

**Architecture :** dony-pro n'est aujourd'hui **pas tracké par git** (0 fichier). On ne peut donc pas committer de façon incrémentale avant le commit inaugural. La stratégie : appliquer toutes les corrections dans le working tree (Tâches 1→3), vérifier que tout est vert, puis faire **un seul commit inaugural propre** (Tâche 4). Ça respecte la règle « ne jamais committer de test rouge » du `CLAUDE.md`, qui prime sur « commits fréquents » pour un import initial.

**Tech Stack :** Nuxt 3, TypeScript, Vitest (happy-dom), @vue/test-utils, Pinia.

**Contexte de départ vérifié :**
- `dony-pro/.gitignore` existe déjà et ignore `node_modules`, `.nuxt`, `.output`, `coverage`, `.worktrees/`.
- `git worktree list` ne contient QUE le dépôt principal → `dony-pro/.worktrees/feat-capacity-unit/` n'est **pas** un worktree git enregistré, c'est un dossier copié abandonné (gitignoré). Suppression sûre par `rm -rf`.
- Branche courante : `feat/address-book-delivery-selector` (feature backend sans rapport, avec des modifs non committées). Le versioning de dony-pro se fera sur une **branche dédiée**, en stageant **uniquement** `dony-pro/`.
- La recherche colis a migré de `senderSearch` (par expéditeur) vers `search` unifié (expéditeur **ou** n° de suivi), + colonne « n°suivi » dans l'export CSV. Les 3 tests cassés et un shim mort `senderSearch` sont restés en arrière. Comportement cible = le code actuel (`search`) ; on met les tests à jour et on supprime le code mort.
- `app/features/trajets/components/TripDetailBids.vue` possède son **propre** `senderSearch` local (feature trajets, indépendante). **Ne pas y toucher.**

Toutes les commandes s'exécutent depuis `dony-pro/`.

---

### Task 1 : Nettoyer le worktree orphelin + exclure `.worktrees/` de vitest

**Files:**
- Delete: `dony-pro/.worktrees/feat-capacity-unit/` (dossier entier)
- Modify: `dony-pro/vitest.config.ts:11`

- [ ] **Step 1 : Vérifier que le worktree n'est pas enregistré dans git**

Run (depuis la racine du monorepo `/home/a-diakite/Desktop/MyProject/my_app`) :
```bash
git worktree list
```
Expected : une seule ligne, le dépôt principal. **Si** `dony-pro/.worktrees/feat-capacity-unit` apparaît, NE PAS faire `rm -rf` : utiliser `git worktree remove dony-pro/.worktrees/feat-capacity-unit` à la place. Sinon continuer au Step 2.

- [ ] **Step 2 : Supprimer le dossier orphelin**

Run (depuis `dony-pro/`) :
```bash
rm -rf .worktrees/feat-capacity-unit
```

- [ ] **Step 3 : Vérifier que le dossier a disparu**

Run :
```bash
ls .worktrees 2>/dev/null || echo "removed"
```
Expected : `.worktrees` vide ou message `removed`.

- [ ] **Step 4 : Exclure `.worktrees/` du scan vitest**

Dans `vitest.config.ts`, remplacer la ligne `exclude` du bloc `test` :

```ts
    exclude: ['node_modules/**', '.nuxt/**', '.output/**', 'tests/e2e/**'],
```

par :

```ts
    exclude: ['node_modules/**', '.nuxt/**', '.output/**', 'tests/e2e/**', '.worktrees/**'],
```

- [ ] **Step 5 : Vérifier que la suite ne scanne plus le worktree**

Run :
```bash
npm run test 2>&1 | grep -c ".worktrees"
```
Expected : `0` (plus aucune référence `.worktrees` dans la sortie). Les 3 échecs restants seront dans `tests/unit/features/colis/` (corrigés en Task 2).

Pas de commit ici (dony-pro encore non tracké — voir Task 4).

---

### Task 2 : Réparer les 3 tests colis cassés + supprimer le code mort `senderSearch`

**Files:**
- Modify: `dony-pro/app/features/colis/components/BidFilters.vue:15`
- Modify: `dony-pro/app/features/colis/composables/useBids.ts:73-76,151`
- Modify: `dony-pro/app/pages/colis/index.vue:34,95`
- Modify: `dony-pro/tests/unit/features/colis/BidFilters.spec.ts:13-17,54-59`
- Modify: `dony-pro/tests/unit/features/colis/useBids.spec.ts:41,105-110,190`

- [ ] **Step 1 : Lancer les tests colis pour constater l'échec (baseline)**

Run :
```bash
npx vitest run tests/unit/features/colis/useBids.spec.ts tests/unit/features/colis/BidFilters.spec.ts
```
Expected : FAIL — 3 tests en échec :
- `useBids > setSenderSearch updates senderSearch …` (`filters.value.senderSearch` → `undefined`)
- `useBids > exportCsv … header` (header reçu contient `n°suivi`, attendu sans)
- `BidFilters > emits update:senderSearch on input` (input introuvable / event non émis)

- [ ] **Step 2 : Supprimer l'émetteur mort `update:senderSearch` dans `BidFilters.vue`**

Remplacer le bloc `defineEmits` :

```ts
const emit = defineEmits<{
  'update:statusFilter': [value: BidFilter]
  'update:tripId': [value: string | null]
  'update:senderSearch': [value: string]
  'update:search': [value: string]
}>()
```

par :

```ts
const emit = defineEmits<{
  'update:statusFilter': [value: BidFilter]
  'update:tripId': [value: string | null]
  'update:search': [value: string]
}>()
```

- [ ] **Step 3 : Supprimer le shim mort `setSenderSearch` dans `useBids.ts`**

Supprimer ces 4 lignes (le commentaire + la fonction + la ligne vide qui suit) :

```ts
  // Keep for backwards compat with BidFilters emit
  function setSenderSearch(search: string): void {
    setSearch(search)
  }

```

de sorte que `setSearch` soit immédiatement suivi de `const filteredBids = computed(() => {`.

Puis, dans le bloc `return { … }`, supprimer la ligne `setSenderSearch,` :

```ts
    setStatusFilter,
    setTripFilter,
    setSearch,
    setSenderSearch,
    toggleSelection,
```

devient :

```ts
    setStatusFilter,
    setTripFilter,
    setSearch,
    toggleSelection,
```

- [ ] **Step 4 : Retirer la consommation morte dans `pages/colis/index.vue`**

Dans le `const { … } = useBids()`, supprimer `setSenderSearch,` :

```ts
  setSearch,
  setSenderSearch,
  toggleSelection,
```

devient :

```ts
  setSearch,
  toggleSelection,
```

Dans le `<template>`, supprimer le handler de l'event jamais émis :

```vue
      @update:trip-id="setTripFilter"
      @update:sender-search="setSenderSearch"
      @update:search="setSearch"
```

devient :

```vue
      @update:trip-id="setTripFilter"
      @update:search="setSearch"
```

- [ ] **Step 5 : Mettre à jour `BidFilters.spec.ts`**

Remplacer `defaultFilters` :

```ts
const defaultFilters = {
  statusFilter: 'TOUS' as const,
  tripId: null,
  senderSearch: '',
}
```

par :

```ts
const defaultFilters = {
  statusFilter: 'TOUS' as const,
  tripId: null,
  search: '',
}
```

Remplacer le test `emits update:senderSearch on input` :

```ts
  it('emits update:senderSearch on input', async () => {
    const wrapper = await mountBidFilters()
    const input = wrapper.find('[data-test="filter-sender-search"]')
    await input.setValue('Alice')
    expect(wrapper.emitted('update:senderSearch')?.[0]).toEqual(['Alice'])
  })
```

par :

```ts
  it('emits update:search on input', async () => {
    const wrapper = await mountBidFilters()
    const input = wrapper.find('[data-test="filter-search"]')
    await input.setValue('Alice')
    expect(wrapper.emitted('update:search')?.[0]).toEqual(['Alice'])
  })
```

- [ ] **Step 6 : Mettre à jour `useBids.spec.ts`**

a) Rendre `fakeBid` type-correct en ajoutant les champs tracking. Remplacer la fin de l'objet :

```ts
  createdAt: '2026-05-01T10:00:00Z',
  expiresAt: null,
}
```

par :

```ts
  createdAt: '2026-05-01T10:00:00Z',
  expiresAt: null,
  trackingNumber: null,
  trackingToken: null,
}
```

b) Remplacer le test `setSenderSearch updates senderSearch …` :

```ts
  it('setSenderSearch updates senderSearch for client-side filtering', async () => {
    const useBids = await importUseBids()
    const { filters, setSenderSearch } = useBids()
    setSenderSearch('Alice')
    expect(filters.value.senderSearch).toBe('Alice')
  })
```

par :

```ts
  it('setSearch updates the search filter for client-side filtering', async () => {
    const useBids = await importUseBids()
    const { filters, setSearch } = useBids()
    setSearch('Alice')
    expect(filters.value.search).toBe('Alice')
  })
```

c) Mettre à jour l'assertion du header dans le test `exportCsv …`. Remplacer :

```ts
    expect(csv).toContain('id,expéditeur,corridor,date départ,poids (kg),statut,revenus (€)')
```

par :

```ts
    expect(csv).toContain('id,n°suivi,expéditeur,corridor,date départ,poids (kg),statut,revenus (€)')
```

- [ ] **Step 7 : Relancer les tests colis (doivent passer)**

Run :
```bash
npx vitest run tests/unit/features/colis/useBids.spec.ts tests/unit/features/colis/BidFilters.spec.ts
```
Expected : PASS (0 échec).

- [ ] **Step 8 : Lancer la suite complète (régression)**

Run :
```bash
npm run test
```
Expected : `Test Files … passed`, `Tests … passed`, **0 failed**, et aucune référence `.worktrees`.

Pas de commit ici (voir Task 4).

---

### Task 3 : Vérifier la couverture ≥ 90 %

**Files:** aucun (vérification).

- [ ] **Step 1 : Générer le rapport de couverture**

Run :
```bash
npm run test:coverage
```
Expected : exit code `0`. `vitest.config.ts` impose déjà les seuils (`lines/functions/statements ≥ 90`, `branches ≥ 85`) ; si la commande sort en `0`, les seuils sont respectés.

- [ ] **Step 2 : Si la commande échoue sur un seuil**

Lire le tableau de couverture affiché, identifier le(s) fichier(s) sous le seuil, et ajouter des tests ciblés dans `tests/unit/features/<feature>/` couvrant les branches manquantes, puis relancer le Step 1. (La suppression du shim mort `setSenderSearch` ne devrait pas faire baisser la couverture — au contraire.)

Pas de commit ici (voir Task 4).

---

### Task 4 : Commit inaugural — versionner dony-pro dans git

**Files:** tout `dony-pro/` (premier ajout au suivi de version).

- [ ] **Step 1 : Confirmer l'état vert**

Run (depuis `dony-pro/`) :
```bash
npm run test
```
Expected : 0 failed. (Garde-fou avant le commit inaugural.)

- [ ] **Step 2 : Créer une branche dédiée**

> ⚠️ **À confirmer avec l'utilisateur avant exécution** : nom de branche et fait qu'on versionne dony-pro séparément de la feature backend en cours. Ne PAS committer sur `feat/address-book-delivery-selector`.

Run (depuis la racine du monorepo) :
```bash
git switch -c feat/dony-pro-versioning
```
Expected : `Switched to a new branch 'feat/dony-pro-versioning'`. Les modifs non committées de l'address-book restent dans le working tree, non stagées.

- [ ] **Step 3 : Stager UNIQUEMENT dony-pro**

> ⚠️ Ne JAMAIS utiliser `git add -A` / `git add .` ici : ça embarquerait les modifs backend address-book et d'autres fichiers racine non liés.

Run (depuis la racine du monorepo) :
```bash
git add dony-pro/
git status --short dony-pro/ | head
```
Expected : une liste de fichiers `A  dony-pro/…`. Vérifier qu'AUCUN `node_modules/`, `.nuxt/`, `.output/`, `coverage/`, `.worktrees/` n'apparaît (le `.gitignore` les exclut).

- [ ] **Step 4 : Vérifier ce qui sera committé (hors dony-pro = exclu)**

Run :
```bash
git status --short | grep -v '^A  dony-pro/' | head
```
Expected : les fichiers backend address-book et autres restent en `??`/`M`/`D` **non stagés** (pas en `A`). S'ils apparaissent stagés, faire `git restore --staged <fichier>`.

- [ ] **Step 5 : Créer le commit inaugural**

Run :
```bash
git commit -m "$(cat <<'EOF'
chore(dony-pro): versionner le portail web voyageur PRO (import initial)

Premier suivi de version de dony-pro (Nuxt 3). Inclut les corrections P0 :
- recherche colis unifiée (expéditeur ou n° de suivi), tests alignés
- suppression du code mort senderSearch (BidFilters, useBids, page colis)
- exclusion de .worktrees/ du scan vitest
- suppression du dossier worktree orphelin

Couverture >= 90 %, suite verte. Voir docs/2026-05-27-inventaire-roadmap.md.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6 : Vérifier le commit**

Run :
```bash
git log --oneline -1 && git ls-files dony-pro/ | wc -l
```
Expected : le commit apparaît ; le nombre de fichiers trackés dans `dony-pro/` est > 0 (≈ une centaine). Ne PAS pousser (`git push`) sans demande explicite de l'utilisateur.

---

## Self-review

- **Couverture spec :** P0 #1 (versioning) → Task 4 ; #2 (3 tests cassés) → Task 2 ; #3 (`BidFilters` emit) → Task 2 Step 2 ; #4 (worktree + vitest) → Task 1 ; #5 (couverture ≥ 90 %) → Task 3. ✅ Tous couverts.
- **Pas de placeholder :** chaque édition montre le code avant/après exact ; chaque commande a une sortie attendue. ✅
- **Cohérence des noms :** `search`/`setSearch`/`update:search`/`filter-search`/`n°suivi` employés de façon identique dans le code et les tests. Le `senderSearch` de `TripDetailBids.vue` (feature trajets) est explicitement hors périmètre. ✅
- **Ordre des commits :** un seul commit inaugural (Task 4) car dony-pro est non tracké au départ ; rationale documentée dans l'en-tête. ✅
