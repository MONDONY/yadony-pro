# Complete Trip Recurrence Dony Pro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/recurrences` into a complete responsive trip scheduler with direct trip configuration, preview, editing, lifecycle actions, and friendly publication errors.

**Architecture:** Keep HTTP mapping in `tripRecurrenceService`, calendar preview in a pure TypeScript module, and form state in a dedicated composable. Split the current manager into a list orchestrator and focused form/card components while reusing the existing trip field widgets.

**Tech Stack:** Nuxt 4, Vue 3 Composition API, TypeScript, Tailwind CSS, Vitest, Vue Test Utils, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-27-complete-trip-recurrence-design.md`

## Global Constraints

- The form works without a saved template; templates are optional prefill shortcuts.
- Frequencies are 1, 2, 3, or 4 weeks.
- Publication lead choices are 7, 14, 21, or 30 days, defaulting to 14.
- Handover lead choices are 0, 1, 2, or 3 days, defaulting to 1.
- `startDate` is required; `endDate` is optional and unbounded.
- Editing affects only future, not-yet-generated announcements.
- The UI exposes no raw HTTP method, endpoint, status, stack, or backend detail.
- Existing design tokens, Lucide icons, lower-level trip components, and API helpers are reused.
- The page must not overlap or overflow at 390 px mobile and 1440 px desktop widths.

---

### Task 1: Extend recurrence types and API mapping

**Files:**
- Modify: `app/features/trajets/types/index.ts`
- Modify: `app/features/trajets/services/tripRecurrenceService.ts`
- Modify: `tests/unit/features/trajets/tripRecurrenceService.spec.ts`

**Interfaces:**
- Produces `TripRecurrenceStatus`, `RecurrenceFormData`, extended `UserTripRecurrence`, and extended `SaveTripRecurrencePayload`.
- Produces service mapping for schedule, status, next dates, description, and safe error metadata.

- [ ] **Step 1: Extend the service fixture and write failing mapping tests**

Add fields such as:

```ts
startDate: '2026-09-01',
endDate: null,
weekInterval: 2,
publicationLeadDays: 14,
handoverLeadDays: 1,
description: 'Remise uniquement le matin',
status: 'ACTIVE',
nextDepartureDate: '2026-09-14',
nextPublicationDate: '2026-08-31',
lastPublicationErrorCode: null,
lastPublicationErrorMessage: null,
lastPublicationErrorAt: null,
```

Assert that `recurrenceToPayload` preserves every editable field and excludes response-only status/error fields.

- [ ] **Step 2: Run the service test to verify failure**

```bash
pnpm vitest run tests/unit/features/trajets/tripRecurrenceService.spec.ts
```

Expected: FAIL on missing properties.

- [ ] **Step 3: Add exact frontend types and mapping**

Define:

```ts
export type TripRecurrenceStatus = 'UPCOMING' | 'ACTIVE' | 'PAUSED' | 'TERMINATED' | 'ACTION_REQUIRED'
```

Keep `horizonDays` in the response type for legacy compatibility, but send `publicationLeadDays` from all new Dony Pro submissions.

- [ ] **Step 4: Run the service test**

```bash
pnpm vitest run tests/unit/features/trajets/tripRecurrenceService.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/features/trajets/types/index.ts app/features/trajets/services/tripRecurrenceService.ts tests/unit/features/trajets/tripRecurrenceService.spec.ts
git commit -m "feat(recurrence): map complete schedules"
```

### Task 2: Calendar preview calculator

**Files:**
- Create: `app/features/trajets/lib/recurrenceCalendar.ts`
- Create: `tests/unit/features/trajets/recurrenceCalendar.spec.ts`

**Interfaces:**
- Produces `getNextOccurrences(schedule, fromDate, count): RecurrenceOccurrence[]`.
- `RecurrenceOccurrence` contains ISO `departureDate` and `publicationDate` strings.

- [ ] **Step 1: Write failing deterministic calendar tests**

Cover the same vectors as the backend plan. Include:

```ts
expect(getNextOccurrences({
  startDate: '2026-09-01', endDate: null, weekdays: '1000100',
  weekInterval: 2, publicationLeadDays: 14,
}, '2026-08-20', 3)).toEqual([
  { departureDate: '2026-09-04', publicationDate: '2026-08-21' },
  { departureDate: '2026-09-14', publicationDate: '2026-08-31' },
  { departureDate: '2026-09-18', publicationDate: '2026-09-04' },
])
```

Add timezone regression coverage proving date-only strings do not shift when the machine timezone is west or east of UTC.

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm vitest run tests/unit/features/trajets/recurrenceCalendar.spec.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement date-only UTC-safe helpers**

Parse `YYYY-MM-DD` by integer parts and use UTC getters/setters consistently. Return an empty list when the period has ended. Validate weekday strings and interval range explicitly.

- [ ] **Step 4: Run calculator tests**

```bash
pnpm vitest run tests/unit/features/trajets/recurrenceCalendar.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/features/trajets/lib/recurrenceCalendar.ts tests/unit/features/trajets/recurrenceCalendar.spec.ts
git commit -m "feat(recurrence): preview scheduled dates"
```

### Task 3: Recurrence form state and validation

**Files:**
- Create: `app/features/trajets/composables/useRecurrenceForm.ts`
- Create: `tests/unit/features/trajets/useRecurrenceForm.spec.ts`

**Interfaces:**
- Consumes recurrence types and `getNextOccurrences`.
- Produces `form`, `errors`, `applyTemplate`, `applyRecurrence`, `validate`, `buildPayload`, and computed `previewOccurrences`.

- [ ] **Step 1: Write failing composable tests**

Test defaults, direct entry, template prefill, recurrence edit prefill, required cities/addresses/transport/day/start date, invalid end date, and complete payload mapping. The default assertion is:

```ts
expect(form.weekInterval).toBe(1)
expect(form.publicationLeadDays).toBe(14)
expect(form.handoverLeadDays).toBe(1)
expect(form.endDate).toBe('')
```

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm vitest run tests/unit/features/trajets/useRecurrenceForm.spec.ts
```

Expected: FAIL because the composable does not exist.

- [ ] **Step 3: Implement the composable**

Reuse `SelectedPlace`, `TransportMode`, `CapacityUnit`, and pricing types. Keep the recurrence-specific relative handover delay instead of an absolute handover date. `buildPayload()` returns `null` until validation succeeds and maps selected days to a seven-character string.

- [ ] **Step 4: Run composable tests**

```bash
pnpm vitest run tests/unit/features/trajets/useRecurrenceForm.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/features/trajets/composables/useRecurrenceForm.ts tests/unit/features/trajets/useRecurrenceForm.spec.ts
git commit -m "feat(recurrence): manage schedule form state"
```

### Task 4: Complete recurrence form UI

**Files:**
- Create: `app/features/trajets/components/RecurrenceForm.vue`
- Create: `app/features/trajets/components/RecurrenceScheduleFields.vue`
- Create: `app/features/trajets/components/RecurrencePreview.vue`
- Create: `tests/unit/features/trajets/RecurrenceForm.spec.ts`

**Interfaces:**
- Consumes `useRecurrenceForm`, `tripTemplateService`, `configService`, and lower-level trip widgets.
- Emits `saved: [recurrence: UserTripRecurrence]` and `cancelled: []`.
- Accepts `recurrence?: UserTripRecurrence` for edit mode.

- [ ] **Step 1: Write failing component tests**

Mount with API services mocked. Assert that the form works with no templates, selecting a template prefills fields, schedule controls update the preview, invalid dates show French messages, POST is used for create, PUT for edit, and known API codes map to friendly messages.

- [ ] **Step 2: Run component tests to verify failure**

```bash
pnpm vitest run tests/unit/features/trajets/RecurrenceForm.spec.ts
```

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Build schedule controls and preview**

Use segmented button controls for week interval and lead-day choices, day toggles with `aria-pressed`, date inputs, and an unframed five-row preview. Use fixed button dimensions so labels and selection do not shift layout.

- [ ] **Step 4: Build the full form**

Reuse `GooglePlacesInput`, `TransportModeChips`, `CapacitySelector`, `WeightSlider`, `PriceOptionCards`, and `ContentTagChips`. Load categories, templates, commission, and price-grid data independently so one failure does not clear the edit prefill. Show the live article grid when pricing mode is `MIXED`.

Map API errors through `extractProblem` and a recurrence-specific code map. Unknown failures display only:

```ts
'Impossible d’enregistrer cette programmation. Réessayez.'
```

- [ ] **Step 5: Run component and related field tests**

```bash
pnpm vitest run tests/unit/features/trajets/RecurrenceForm.spec.ts tests/unit/features/trajets/PriceOptionCards.spec.ts tests/unit/features/trajets/ContentTagChips.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/features/trajets/components/RecurrenceForm.vue app/features/trajets/components/RecurrenceScheduleFields.vue app/features/trajets/components/RecurrencePreview.vue tests/unit/features/trajets/RecurrenceForm.spec.ts
git commit -m "feat(recurrence): add complete schedule form"
```

### Task 5: List, statuses, and lifecycle actions

**Files:**
- Modify: `app/features/trajets/components/RecurrencesManager.vue`
- Create: `app/features/trajets/components/RecurrenceListItem.vue`
- Create: `tests/unit/features/trajets/RecurrencesManager.spec.ts`
- Modify: `app/pages/recurrences/index.vue`

**Interfaces:**
- Consumes `RecurrenceForm` and the extended service.
- Produces the complete `/recurrences` page with create, edit, pause/resume, delete, and error states.

- [ ] **Step 1: Write failing manager tests**

Assert rendering of all five statuses, next publication/departure dates, opening direct create with no templates, edit prefill, optimistic pause with rollback on failure, deletion confirmation, and replacement of a saved item in place.

- [ ] **Step 2: Run manager tests to verify failure**

```bash
pnpm vitest run tests/unit/features/trajets/RecurrencesManager.spec.ts
```

Expected: FAIL against the current template-only manager.

- [ ] **Step 3: Implement list items and manager state**

Use badge colors from the existing semantic tokens. Use Lucide `Pencil`, `Pause`, `Play`, and `Trash2` icon buttons with accessible labels and tooltips. Do not nest the form inside a recurrence card; render list mode and form mode as sibling page states.

- [ ] **Step 4: Add friendly empty, loading, and action-required states**

The empty state button opens direct creation. `ACTION_REQUIRED` shows the safe backend message and a route to the relevant settings page only for mapped actionable codes.

- [ ] **Step 5: Run manager tests**

```bash
pnpm vitest run tests/unit/features/trajets/RecurrencesManager.spec.ts tests/unit/features/trajets/RecurrenceForm.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/features/trajets/components/RecurrencesManager.vue app/features/trajets/components/RecurrenceListItem.vue tests/unit/features/trajets/RecurrencesManager.spec.ts app/pages/recurrences/index.vue
git commit -m "feat(recurrence): manage schedule lifecycle"
```

### Task 6: End-to-end and responsive verification

**Files:**
- Create: `tests/e2e/recurrences.spec.ts`
- Modify only files required by failures directly caused by Tasks 1 through 5.

**Interfaces:**
- Produces a verified Dony Pro branch ready to integrate after the backend.

- [ ] **Step 1: Add the failing Playwright flow**

Mock `/trip-recurrences`, `/trip-templates`, content categories, price grid, and address lookup. Cover direct creation, frequency selection, optional end date, five-date preview, successful POST, edit via PUT, pause/resume, and delete confirmation.

- [ ] **Step 2: Run the E2E test to verify it fails before final wiring**

```bash
pnpm playwright test tests/e2e/recurrences.spec.ts --project=chromium
```

Expected: FAIL until all selectors and lifecycle wiring are complete.

- [ ] **Step 3: Finish only missing task-scope wiring**

Fix selectors, loading transitions, or responsive constraints exposed by the test. Do not add new recurrence modes or unrelated page redesign.

- [ ] **Step 4: Run focused unit and E2E tests**

```bash
pnpm vitest run tests/unit/features/trajets/recurrenceCalendar.spec.ts tests/unit/features/trajets/useRecurrenceForm.spec.ts tests/unit/features/trajets/tripRecurrenceService.spec.ts tests/unit/features/trajets/RecurrenceForm.spec.ts tests/unit/features/trajets/RecurrencesManager.spec.ts
pnpm playwright test tests/e2e/recurrences.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 5: Start the dev server and capture desktop/mobile screenshots**

```bash
pnpm dev --host 127.0.0.1
```

Use Playwright at 1440x900 and 390x844. Verify no horizontal scroll, clipped controls, overlapping text, nested cards, or invisible action buttons.

- [ ] **Step 6: Run the complete Dony Pro gate**

```bash
pnpm test:coverage
pnpm build
pnpm playwright test
```

Expected: all tests pass, coverage thresholds pass, and Nuxt build exits 0.

- [ ] **Step 7: Review and commit final adjustments**

```bash
git diff --check
git status --short
git add app tests
git commit -m "test(recurrence): verify complete scheduling flow"
```

Skip the final commit when there are no adjustments after the previous task commits.
