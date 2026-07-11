# Statut DRAFT (brouillon) — dony-pro (web) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Câbler côté web pro le statut DRAFT livré par le backend : enregistrer un trajet comme brouillon, le filtrer, l'afficher (badge/bannière) et le publier depuis le détail.

**Architecture:** Le backend (PR dony-back #95) expose `saveAsDraft` sur `POST /announcements` et `POST /announcements/{id}/publish`. Côté web : extension des types (`TripStatus`, `TripFilter`), du `tripsService`, du composable de formulaire, plus un helper partagé d'extraction ProblemDetail pour mapper les codes d'erreur RFC 7807.

**Tech Stack:** Nuxt 4, Vue 3.5, TypeScript, vitest (`vitest run`), pattern mock `useApi` existant.

## Global Constraints

- Spec de référence : `docs/superpowers/specs/2026-07-11-trip-draft-status-design.md` (section 2).
- Branche : `feature/trip-draft-status` (existe déjà sur dony-pro — un scaffolding partiel y est commité : boutons `btn-draft`/`btn-publish` dans `NewAnnouncementForm.vue`, `submit(_status)` qui ignore le statut. On FINIT ce câblage, on ne recrée rien).
- Codes d'erreur backend (RFC 7807, champ `code` du ProblemDetail) : `draft-limit-reached` (403), `not-a-draft` (422), `publishing-suspended` (403), `kyc-not-verified` (403), `pro-limit-reached` (403), `departure-date-passed` (422).
- Message quota brouillons (copie exacte) : « Limite de brouillons atteinte. Passez en PRO pour en créer davantage. »
- Filtre liste : chip « Brouillons » → query `status=DRAFT` ; redirection post-brouillon vers `/trajets?filter=BROUILLONS`.
- **Déviation actée vs spec** : la spec demande « redirection + toast » après sauvegarde d'un brouillon ; dony-pro n'a AUCUN système de toast. On garde l'écran de succès inline existant (`nouvelle-annonce.vue`, déjà status-aware) et on remplace le CTA « Gérer ce trajet → » par « Voir mes brouillons » (lien `/trajets?filter=BROUILLONS`) quand le trajet est un brouillon. Ne pas créer de système de toast (YAGNI).
- Badge brouillon : variante `warning` (ambre) — variantes dispo : `info | success | warning | danger | neutral` (`app/components/ui/badge/index.ts`).
- TDD strict : test rouge d'abord, implémentation minimale ensuite. Commandes : `pnpm test` (= `vitest run`) ; si `pnpm` indisponible, `npx vitest run`.
- Pas de `Co-Authored-By` dans les commits. Messages en français, format conventionnel.

---

### Task 1: Types + tripsService (saveAsDraft, publish, filtre BROUILLONS)

**Files:**
- Modify: `app/features/trajets/types/index.ts:3` (TripStatus), `:6` (TripFilter)
- Modify: `app/features/trajets/services/tripsService.ts:176-179` (createAnnouncement), `:264-269` (return), `:272-281` (filterToStatus)
- Test: `tests/unit/features/trajets/tripsService.spec.ts`

**Interfaces:**
- Consumes: backend `POST /announcements` (body accepte `saveAsDraft: boolean`), `POST /announcements/{id}/publish` (200 → annonce détaillée).
- Produces: `createAnnouncement(payload: CreateAnnouncementPayload, opts?: { saveAsDraft?: boolean }): Promise<Trip>` ; `publishAnnouncement(id: string): Promise<Trip>` ; `TripStatus` inclut `'DRAFT'` ; `TripFilter` inclut `'BROUILLONS'`.

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `tests/unit/features/trajets/tripsService.spec.ts`, ajouter après le test `createAnnouncement POSTs to /announcements` (l.46-72) — réutiliser tels quels le `fakeTrip` et le `payload` de ce test (copier les mêmes littéraux) :

```ts
it('createAnnouncement transmet saveAsDraft: true dans le body en mode brouillon', async () => {
  mockApiFn.mockResolvedValue({ ...fakeTrip, status: 'DRAFT' })
  const { tripsService } = await import('@/features/trajets/services/tripsService')
  const svc = tripsService()
  const result = await svc.createAnnouncement(payload, { saveAsDraft: true })
  expect(mockApiFn).toHaveBeenCalledWith('/announcements', {
    method: 'POST',
    body: { ...payload, saveAsDraft: true },
  })
  expect(result.status).toBe('DRAFT')
})

it('publishAnnouncement POSTe sur /announcements/{id}/publish', async () => {
  mockApiFn.mockResolvedValue(fakeTrip)
  const { tripsService } = await import('@/features/trajets/services/tripsService')
  const svc = tripsService()
  const result = await svc.publishAnnouncement('trip-1')
  expect(mockApiFn).toHaveBeenCalledWith('/announcements/trip-1/publish', { method: 'POST' })
  expect(result.status).toBe('ACTIVE')
})

it('listTrips mappe le filtre BROUILLONS vers status=DRAFT', async () => {
  mockApiFn.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 })
  const { tripsService } = await import('@/features/trajets/services/tripsService')
  const svc = tripsService()
  await svc.listTrips({ filter: 'BROUILLONS' })
  expect(mockApiFn).toHaveBeenCalledWith('/announcements/my', { query: { status: 'DRAFT' } })
})
```

Note : `fakeTrip`/`payload` sont locaux au test existant — extraire ces deux littéraux en constantes de module (au-dessus du `describe`) pour les partager, sans changer leurs valeurs.

- [ ] **Step 2: Vérifier l'échec**

Run: `npx vitest run tests/unit/features/trajets/tripsService.spec.ts`
Expected: FAIL — `publishAnnouncement is not a function`, filtre `BROUILLONS` refusé par le type/`filterToStatus`, body sans `saveAsDraft`.

- [ ] **Step 3: Implémentation minimale**

`app/features/trajets/types/index.ts` :

```ts
// ligne 3
export type TripStatus = 'DRAFT' | 'ACTIVE' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
// ligne 6
export type TripFilter = 'TOUS' | 'ACTIFS' | 'COMPLETS' | 'EN_COURS' | 'TERMINES' | 'ANNULES' | 'BROUILLONS'
```

`app/features/trajets/services/tripsService.ts` :

```ts
async function createAnnouncement(
  payload: CreateAnnouncementPayload,
  opts?: { saveAsDraft?: boolean },
): Promise<Trip> {
  const body = opts?.saveAsDraft ? { ...payload, saveAsDraft: true } : payload
  const result = await api<BackendAnnouncementResponse>('/announcements', { method: 'POST', body })
  return mapBackendToTrip(result)
}

async function publishAnnouncement(id: string): Promise<Trip> {
  const result = await api<BackendAnnouncementResponse>(`/announcements/${id}/publish`, { method: 'POST' })
  return mapBackendToTrip(result)
}
```

Dans `filterToStatus` (l.272-281), ajouter `BROUILLONS: 'DRAFT'` au `Record` (le type `Exclude<TripFilter,'TOUS'>` force l'ajout à la compilation). Ajouter `publishAnnouncement` au `return` du service (l.264-269).

- [ ] **Step 4: Vérifier le passage**

Run: `npx vitest run tests/unit/features/trajets/tripsService.spec.ts`
Expected: PASS, aucun autre test cassé (le test existant `createAnnouncement POSTs to /announcements` doit rester vert : sans `opts`, le body est le payload inchangé).

- [ ] **Step 5: Commit**

```bash
git add app/features/trajets/types/index.ts app/features/trajets/services/tripsService.ts tests/unit/features/trajets/tripsService.spec.ts
git commit -m "feat(trajets): service brouillon — saveAsDraft, publishAnnouncement, filtre BROUILLONS"
```

---

### Task 2: Helper extractProblem (ProblemDetail RFC 7807)

**Files:**
- Create: `app/lib/apiError.ts`
- Test: `tests/unit/lib/apiError.spec.ts` (créer le dossier si absent)

**Interfaces:**
- Consumes: erreurs `FetchError` d'ofetch/nuxt — le corps ProblemDetail du backend est dans `err.data` (`{ type, title, status, detail, code }`).
- Produces: `extractProblem(e: unknown): { code: string | null; detail: string | null }` — consommé par Tasks 3 et 5.

- [ ] **Step 1: Écrire les tests qui échouent**

`tests/unit/lib/apiError.spec.ts` :

```ts
import { describe, it, expect } from 'vitest'
import { extractProblem } from '@/lib/apiError'

describe('extractProblem', () => {
  it('extrait code et detail d’un ProblemDetail RFC 7807', () => {
    const err = { data: { code: 'draft-limit-reached', detail: 'Limite de brouillons atteinte.', status: 403 } }
    expect(extractProblem(err)).toEqual({ code: 'draft-limit-reached', detail: 'Limite de brouillons atteinte.' })
  })

  it('renvoie des nulls quand l’erreur n’a pas de corps ProblemDetail', () => {
    expect(extractProblem(new Error('network'))).toEqual({ code: null, detail: null })
    expect(extractProblem(null)).toEqual({ code: null, detail: null })
    expect(extractProblem({ data: 'oops' })).toEqual({ code: null, detail: null })
  })

  it('ignore les champs non-string', () => {
    expect(extractProblem({ data: { code: 42, detail: {} } })).toEqual({ code: null, detail: null })
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npx vitest run tests/unit/lib/apiError.spec.ts`
Expected: FAIL — module `@/lib/apiError` introuvable.

- [ ] **Step 3: Implémentation minimale**

`app/lib/apiError.ts` :

```ts
// Extraction du corps ProblemDetail (RFC 7807) d'une erreur $fetch/ofetch.
// Le backend renvoie { type, title, status, detail, code } — on ne lit que code + detail.
export interface ProblemInfo {
  code: string | null
  detail: string | null
}

export function extractProblem(e: unknown): ProblemInfo {
  const data = (e as { data?: unknown } | null | undefined)?.data
  if (typeof data !== 'object' || data === null) return { code: null, detail: null }
  const { code, detail } = data as { code?: unknown; detail?: unknown }
  return {
    code: typeof code === 'string' ? code : null,
    detail: typeof detail === 'string' ? detail : null,
  }
}
```

- [ ] **Step 4: Vérifier le passage**

Run: `npx vitest run tests/unit/lib/apiError.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/lib/apiError.ts tests/unit/lib/apiError.spec.ts
git commit -m "feat(lib): helper extractProblem pour les erreurs ProblemDetail RFC 7807"
```

---

### Task 3: Formulaire — propager saveAsDraft, mapper les erreurs, écran de succès brouillon

**Files:**
- Modify: `app/features/trajets/composables/useAnnouncementForm.ts:82-88` (submit)
- Modify: `app/features/trajets/components/NewAnnouncementForm.vue:122-138` (handleSubmit, mapping erreurs)
- Modify: `app/pages/trajets/nouvelle-annonce.vue:42-73` (écran succès)
- Test: `tests/unit/features/trajets/useAnnouncementForm.spec.ts`

**Interfaces:**
- Consumes: `createAnnouncement(payload, { saveAsDraft })` (Task 1), `extractProblem` (Task 2).
- Produces: `submit(status: 'DRAFT' | 'PUBLISHED'): Promise<Trip>` propage réellement le statut. Les boutons `btn-draft`/`btn-publish` existent déjà dans le template (l.445-470) — ne pas les toucher.

- [ ] **Step 1: Renforcer les tests existants (RED)**

Dans `tests/unit/features/trajets/useAnnouncementForm.spec.ts`, les tests `submit('PUBLISHED')` (l.~85) et `submit('DRAFT')` (l.~129) existent mais n'assèrent pas la propagation. Modifier leurs asserts :

- test PUBLISHED : remplacer l'assert `toHaveBeenCalledWith(expect.objectContaining({ transportMode: ... }))` par :

```ts
expect(mockCreate).toHaveBeenCalledWith(
  expect.objectContaining({ transportMode: 'PLANE' }),
  { saveAsDraft: false },
)
```

- test DRAFT :

```ts
expect(mockCreate).toHaveBeenCalledWith(
  expect.objectContaining({ transportMode: 'PLANE' }),
  { saveAsDraft: true },
)
```

(Adapter la valeur `transportMode` à celle déjà utilisée dans le test — ne pas changer l'arrange existant.)

- [ ] **Step 2: Vérifier l'échec**

Run: `npx vitest run tests/unit/features/trajets/useAnnouncementForm.spec.ts`
Expected: FAIL — `createAnnouncement` appelé avec 1 seul argument.

- [ ] **Step 3: Implémentation minimale (composable)**

`useAnnouncementForm.ts` :

```ts
async function submit(status: 'DRAFT' | 'PUBLISHED'): Promise<Trip> {
  const errors = validate()
  if (Object.keys(errors).length > 0) {
    throw new Error('Formulaire invalide')
  }
  return svc.createAnnouncement(buildPayload(), { saveAsDraft: status === 'DRAFT' })
}
```

- [ ] **Step 4: Vérifier le passage**

Run: `npx vitest run tests/unit/features/trajets/useAnnouncementForm.spec.ts`
Expected: PASS.

- [ ] **Step 5: Mapper les erreurs dans le formulaire**

`NewAnnouncementForm.vue`, dans le `catch` de `handleSubmit` (l.122-138), remplacer le message générique par un mapping par code :

```ts
import { extractProblem } from '@/lib/apiError'

const submitErrorMessages: Record<string, string> = {
  'draft-limit-reached': 'Limite de brouillons atteinte. Passez en PRO pour en créer davantage.',
  'pro-limit-reached': 'Limite mensuelle d’annonces atteinte. Passez en PRO pour publier davantage.',
  'kyc-not-verified': 'Vérifiez votre identité (KYC) dans les paramètres avant de publier un trajet.',
  'publishing-suspended': 'La publication est suspendue sur votre compte. Contactez le support.',
}
```

et dans le `catch` :

```ts
catch (e) {
  const { code, detail } = extractProblem(e)
  errors.value.global =
    (code && submitErrorMessages[code]) || detail || 'Une erreur est survenue. Réessayez.'
}
```

(Conserver la structure existante du handler : `validate()` → `submitEdit`/`submit` → `emit('submitted', trip)`.)

- [ ] **Step 6: Écran de succès brouillon**

`app/pages/trajets/nouvelle-annonce.vue` — l'écran de succès (l.42-73) branche déjà sur `submittedTrip.status === 'ACTIVE'`. Ajuster :

- Texte du cas non-ACTIVE (l.55-57) :

```html
<template v-else>
  Votre brouillon est enregistré. Il est invisible pour les expéditeurs tant qu'il n'est pas publié.
</template>
```

- CTA primaire (l.66-71) : garder « Gérer ce trajet → » pour un trajet ACTIVE ; pour un brouillon, pointer vers la liste filtrée :

```ts
function goToTrip() {
  if (!submittedTrip.value) return
  if (submittedTrip.value.status === 'DRAFT') {
    router.push('/trajets?filter=BROUILLONS')
  } else {
    router.push(`/trajets/${submittedTrip.value.id}`)
  }
}
```

et le libellé du bouton :

```html
<template v-if="submittedTrip.status === 'DRAFT'">Voir mes brouillons →</template>
<template v-else>Gérer ce trajet →</template>
```

- [ ] **Step 7: Vérifier la suite trajets + commit**

Run: `npx vitest run tests/unit/features/trajets/`
Expected: PASS (tous).

```bash
git add app/features/trajets/composables/useAnnouncementForm.ts app/features/trajets/components/NewAnnouncementForm.vue app/pages/trajets/nouvelle-annonce.vue tests/unit/features/trajets/useAnnouncementForm.spec.ts
git commit -m "feat(trajets): enregistrement en brouillon depuis le formulaire + erreurs mappées"
```

---

### Task 4: Liste — chip Brouillons, présélection par query, badges DRAFT

**Files:**
- Modify: `app/features/trajets/components/TripListFilters.vue:29-36` (statusFilters)
- Modify: `app/features/trajets/composables/useTrips.ts` (filtre initial)
- Modify: `app/pages/trajets/index.vue:16-48` (lecture query)
- Modify: `app/features/trajets/components/TripCard.vue:37-51` (mappings badge)
- Modify: `app/features/trajets/components/TripDetailHeader.vue:19-30` (mappings badge — dupliqués)
- Test: `tests/unit/features/trajets/useTrips.spec.ts` (existant — sinon en créer un minimal pour le filtre initial), `tests/unit/features/trajets/TripCard.spec.ts` (existant — sinon créer)

**Interfaces:**
- Consumes: `TripFilter` avec `'BROUILLONS'` (Task 1).
- Produces: `useTrips(initialFilter?: TripFilter)` — `activeFilter` initialisé à `initialFilter ?? 'TOUS'`. Badge : `DRAFT → label 'Brouillon', variant 'warning'`.

- [ ] **Step 1: Tests qui échouent**

Dans le spec de `useTrips` (suivre le pattern de mock service du fichier existant ; s'il n'existe pas, créer `tests/unit/features/trajets/useTrips.spec.ts` sur le modèle de `useTripDetail.spec.ts` — mock `tripsService` avec `listTrips: vi.fn().mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 })`, mock `@/composables/useApi` no-op) :

```ts
it('initialise activeFilter depuis l’argument initialFilter', async () => {
  const { activeFilter } = (await importComposable())('BROUILLONS')
  expect(activeFilter.value).toBe('BROUILLONS')
})

it('activeFilter vaut TOUS par défaut', async () => {
  const { activeFilter } = (await importComposable())()
  expect(activeFilter.value).toBe('TOUS')
})
```

Dans `TripCard.spec.ts` (si absent, créer avec `@vue/test-utils` `mount` en suivant le pattern d'un spec composant existant du projet ; props minimales = un `Trip` complet copié du `fakeTrip` mappé — le plus simple : réutiliser les props d'un test existant du fichier) :

```ts
it('affiche le badge Brouillon en variante warning pour un trajet DRAFT', () => {
  const wrapper = mountCard({ status: 'DRAFT' }) // helper existant du spec, sinon mount avec props du fichier
  expect(wrapper.text()).toContain('Brouillon')
})
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npx vitest run tests/unit/features/trajets/useTrips.spec.ts tests/unit/features/trajets/TripCard.spec.ts`
Expected: FAIL — `useTrips` n'accepte pas d'argument (`activeFilter` reste `'TOUS'`), badge absent (`statusLabel['DRAFT']` undefined).

- [ ] **Step 3: Implémentation minimale**

`useTrips.ts` — signature + init :

```ts
export function useTrips(initialFilter?: TripFilter) {
  const activeFilter = ref<TripFilter>(initialFilter ?? 'TOUS')
  // ... reste inchangé
```

`app/pages/trajets/index.vue` — lire la query au setup :

```ts
import { useRoute } from 'vue-router'
import type { TripFilter } from '@/features/trajets/types/index'

const route = useRoute()
const VALID_FILTERS: TripFilter[] = ['TOUS', 'ACTIFS', 'COMPLETS', 'EN_COURS', 'TERMINES', 'ANNULES', 'BROUILLONS']
const initialFilter = VALID_FILTERS.includes(route.query.filter as TripFilter)
  ? (route.query.filter as TripFilter)
  : undefined

const { trips, activeFilter, /* ... */ } = useTrips(initialFilter)
```

`TripListFilters.vue` (l.29-36) — ajouter la chip en fin de liste :

```ts
{ key: 'BROUILLONS', label: 'Brouillons' },
```

Note compteur : la prop `counts?: Partial<Record<TripFilter, number>>` existe déjà et est rendue par chip (l.82-90). Si la page `/trajets` passe déjà `counts`, `BROUILLONS` en profitera automatiquement ; si elle ne le passe pas, NE PAS ajouter de mécanique de comptage (hors périmètre — nécessiterait un appel API par filtre).

`TripCard.vue` (l.37-51) et `TripDetailHeader.vue` (l.19-30) — ajouter aux DEUX mappings :

```ts
// statusLabel
DRAFT: 'Brouillon',
// statusVariant
DRAFT: 'warning',
```

- [ ] **Step 4: Vérifier le passage**

Run: `npx vitest run tests/unit/features/trajets/`
Expected: PASS (tous).

- [ ] **Step 5: Commit**

```bash
git add app/features/trajets/components/TripListFilters.vue app/features/trajets/composables/useTrips.ts app/pages/trajets/index.vue app/features/trajets/components/TripCard.vue app/features/trajets/components/TripDetailHeader.vue tests/unit/features/trajets/
git commit -m "feat(trajets): filtre Brouillons, présélection par query et badge Brouillon"
```

---

### Task 5: Détail — bannière brouillon + publication

**Files:**
- Modify: `app/features/trajets/composables/useTripDetail.ts` (publishTrip)
- Modify: `app/pages/trajets/[id]/index.vue` (bannière + bouton, vers l.148-154, juste après `<template v-else-if="trip">` avant les onglets)
- Test: `tests/unit/features/trajets/useTripDetail.spec.ts`

**Interfaces:**
- Consumes: `publishAnnouncement(id)` (Task 1), `extractProblem` (Task 2).
- Produces: `useTripDetail` expose en plus `publishLoading: Ref<boolean>`, `publishError: Ref<string | null>`, `publishErrorCode: Ref<string | null>`, `publishTrip(): Promise<void>`.

- [ ] **Step 1: Tests qui échouent**

Dans `tests/unit/features/trajets/useTripDetail.spec.ts` : ajouter `publishAnnouncement: vi.fn()` au `mockSvc` (l.4-20), puis :

```ts
it('publishTrip publie puis recharge le trajet', async () => {
  mockSvc.publishAnnouncement.mockResolvedValue({ ...fakeTrip, status: 'ACTIVE' })
  mockSvc.getAnnouncement.mockResolvedValue({ ...fakeTrip, status: 'ACTIVE' })
  const detail = (await importComposable())('trip-1')
  await detail.publishTrip()
  expect(mockSvc.publishAnnouncement).toHaveBeenCalledWith('trip-1')
  expect(mockSvc.getAnnouncement).toHaveBeenCalled() // refresh
  expect(detail.publishError.value).toBeNull()
})

it('publishTrip mappe kyc-not-verified', async () => {
  mockSvc.publishAnnouncement.mockRejectedValue({ data: { code: 'kyc-not-verified', detail: 'KYC requis' } })
  const detail = (await importComposable())('trip-1')
  await detail.publishTrip()
  expect(detail.publishErrorCode.value).toBe('kyc-not-verified')
  expect(detail.publishError.value).toBe('Vérifiez votre identité (KYC) avant de publier ce trajet.')
})

it('publishTrip mappe departure-date-passed', async () => {
  mockSvc.publishAnnouncement.mockRejectedValue({ data: { code: 'departure-date-passed', detail: 'Date passée' } })
  const detail = (await importComposable())('trip-1')
  await detail.publishTrip()
  expect(detail.publishErrorCode.value).toBe('departure-date-passed')
  expect(detail.publishError.value).toBe('La date de départ est passée. Modifiez le trajet avant de publier.')
})

it('publishTrip mappe pro-limit-reached', async () => {
  mockSvc.publishAnnouncement.mockRejectedValue({ data: { code: 'pro-limit-reached', detail: 'Limite' } })
  const detail = (await importComposable())('trip-1')
  await detail.publishTrip()
  expect(detail.publishError.value).toBe('Limite mensuelle d’annonces atteinte. Passez en PRO pour publier davantage.')
})
```

(`fakeTrip`/`importComposable` : réutiliser les helpers/fixtures déjà présents dans ce fichier — ne pas en recréer.)

- [ ] **Step 2: Vérifier l'échec**

Run: `npx vitest run tests/unit/features/trajets/useTripDetail.spec.ts`
Expected: FAIL — `publishTrip is not a function`.

- [ ] **Step 3: Implémentation minimale (composable)**

`useTripDetail.ts` — sur le modèle de `deleteTrip` (l.47-57) :

```ts
import { extractProblem } from '@/lib/apiError'

const publishLoading = ref(false)
const publishError = ref<string | null>(null)
const publishErrorCode = ref<string | null>(null)

const publishErrorMessages: Record<string, string> = {
  'kyc-not-verified': 'Vérifiez votre identité (KYC) avant de publier ce trajet.',
  'departure-date-passed': 'La date de départ est passée. Modifiez le trajet avant de publier.',
  'pro-limit-reached': 'Limite mensuelle d’annonces atteinte. Passez en PRO pour publier davantage.',
  'publishing-suspended': 'La publication est suspendue sur votre compte. Contactez le support.',
  'not-a-draft': 'Ce trajet n’est pas un brouillon.',
}

async function publishTrip(): Promise<void> {
  publishLoading.value = true
  publishError.value = null
  publishErrorCode.value = null
  try {
    await svc.publishAnnouncement(tripId)
    await fetchTrip()
  } catch (e) {
    const { code, detail } = extractProblem(e)
    publishErrorCode.value = code
    publishError.value =
      (code && publishErrorMessages[code]) || detail || 'Impossible de publier ce trajet.'
  } finally {
    publishLoading.value = false
  }
}
```

Ajouter `publishLoading, publishError, publishErrorCode, publishTrip` au `return` (l.170-192).

- [ ] **Step 4: Vérifier le passage**

Run: `npx vitest run tests/unit/features/trajets/useTripDetail.spec.ts`
Expected: PASS.

- [ ] **Step 5: Bannière dans la page détail**

`app/pages/trajets/[id]/index.vue` — déstructurer en plus `publishLoading, publishError, publishErrorCode, publishTrip` depuis `useTripDetail`. Insérer la bannière juste après `<TripDetailHeader ...>` (l.~153) :

```html
<div
  v-if="trip.status === 'DRAFT'"
  data-test="draft-banner"
  class="rounded-card border border-warning/40 bg-warning/10 p-4 flex flex-col gap-3"
>
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <p class="text-sm text-text">
      <span class="font-medium">Ce trajet est un brouillon</span>
      <span class="text-text-muted"> — invisible pour les expéditeurs tant qu'il n'est pas publié.</span>
    </p>
    <button
      data-test="btn-publish-trip"
      class="h-9 px-4 rounded-btn bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
      :disabled="publishLoading"
      @click="publishTrip"
    >
      {{ publishLoading ? 'Publication…' : 'Publier le trajet' }}
    </button>
  </div>
  <div v-if="publishError" class="text-sm text-danger flex items-center gap-3 flex-wrap" data-test="publish-error">
    <span>{{ publishError }}</span>
    <NuxtLink v-if="publishErrorCode === 'kyc-not-verified'" to="/parametres" class="underline font-medium">
      Vérifier mon identité
    </NuxtLink>
    <NuxtLink v-else-if="publishErrorCode === 'departure-date-passed'" :to="`/trajets/${trip.id}/modifier`" class="underline font-medium">
      Modifier le trajet
    </NuxtLink>
  </div>
</div>
```

(Adapter les classes utilitaires aux tokens réellement utilisés dans la page — `rounded-card`, `bg-warning/10`, etc. existent déjà dans le design system ; vérifier avec les classes voisines du fichier.)

- [ ] **Step 6: Vérifier la suite trajets + commit**

Run: `npx vitest run tests/unit/features/trajets/`
Expected: PASS (tous).

```bash
git add app/features/trajets/composables/useTripDetail.ts app/pages/trajets/[id]/index.vue tests/unit/features/trajets/useTripDetail.spec.ts
git commit -m "feat(trajets): bannière brouillon et publication depuis le détail"
```

---

### Task 6: Suite complète, typecheck, PR

**Files:**
- Aucun nouveau — vérification globale.

- [ ] **Step 1: Suite complète**

Run: `npx vitest run`
Expected: 0 failure. Corriger toute régression avant de continuer.

- [ ] **Step 2: Typecheck / lint si dispo**

Run: `npx nuxt typecheck` (si configuré ; sinon `npx vue-tsc --noEmit` ; si aucun ne marche, le signaler et passer).

- [ ] **Step 3: Couverture**

Run: `npx vitest run --coverage`
Expected: fichiers touchés (`tripsService.ts`, `useAnnouncementForm.ts`, `useTripDetail.ts`, `useTrips.ts`, `apiError.ts`) ≥ 90 % lignes.

- [ ] **Step 4: Push + PR**

```bash
git push -u origin feature/trip-draft-status
gh pr create --title "feat(trajets): statut DRAFT (brouillon) côté web pro" --body "..."
```

Corps de PR : résumé (brouillon au formulaire, filtre/badge, bannière+publication au détail, helper ProblemDetail), lien spec, lien PR back (MONDONY/dony-back#95), résultats de tests.
