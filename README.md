# dony PRO Workspace

Back-office web réservé aux voyageurs PRO (`isProAccount = true`).

## Stack
- Nuxt 4 (SSR) + TypeScript + TailwindCSS + shadcn-vue
- Firebase Phone Auth (token JWT en mémoire — pas de localStorage)
- Backend : Spring Boot existant (`dony-back/`), endpoint `GET /auth/me`

## Setup

```bash
pnpm install
cp .env.example .env.development
# Remplir les clés Firebase (même projet que dony_app/)
pnpm dev
```

## Tests

```bash
pnpm test              # unit tests
pnpm test:coverage     # avec couverture (gate 90%)
pnpm e2e               # E2E Playwright (lance dev server auto)
```

## Phase 1 — Foundation (terminée)
- ✅ Setup Nuxt + Tailwind + shadcn-vue
- ✅ Firebase Phone Auth + Pinia store XSS-safe
- ✅ Middlewares `auth.global` et `pro-only`
- ✅ Sidebar + Topbar + 6 pages placeholder
- ✅ Tests Vitest + Playwright, couverture 90%
- ✅ CI GitHub Actions

## Phases suivantes
- Phase 2 — Mes Trajets (liste, calendrier, formulaire nouvelle annonce)
- Phase 3 — Mes Colis + Centre de commandes
- Phase 4 — Automatisations (back package `automation/` + UI)
- Phase 5 — Demandes compatibles + Mon Activité + Export fiscal

Voir `docs/superpowers/plans/` dans le monorepo `my_app/` pour les specs et plans détaillés.
