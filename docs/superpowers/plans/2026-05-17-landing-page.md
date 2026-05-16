# Landing Page dony PRO — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer la page publique `/landing` de dony PRO avec support dark/light mode, 9 blocs de contenu et les tokens design exacts de l'app Flutter.

**Architecture:** Page Nuxt 3 avec layout dédié `landing.vue` (sans sidebar/topbar), composants isolés dans `app/features/landing/components/`, tokens CSS variables dans `assets/css/main.css` référencés par `tailwind.config.ts`, thème géré côté client via `localStorage` + `prefers-color-scheme`.

**Tech Stack:** Nuxt 3, Vue 3 (Composition API), TailwindCSS v3, CSS custom properties, TypeScript

---

## Carte des fichiers

| Fichier | Action | Responsabilité |
|---|---|---|
| `assets/css/main.css` | Modifier | CSS variables dark + light mode, styles globaux |
| `tailwind.config.ts` | Modifier | Tokens Tailwind → CSS vars, backward compat |
| `nuxt.config.ts` | Modifier | Supprimer `class: 'dark'` hardcodé du head |
| `app/layouts/default.vue` | Modifier | Forcer dark class pour le cockpit |
| `app/middleware/auth.global.ts` | Modifier | Ajouter `/landing` aux routes publiques |
| `app/composables/useTheme.ts` | Créer | Composable réactif pour l'état du thème |
| `app/components/ui/ThemeToggle.vue` | Créer | Bouton bascule soleil/lune |
| `app/layouts/landing.vue` | Créer | Layout vide pour la page publique |
| `app/pages/landing.vue` | Créer | Page assemblant tous les blocs |
| `app/features/landing/components/LandingNav.vue` | Créer | Navbar sticky avec logo PRO + navigation |
| `app/features/landing/components/LandingHero.vue` | Créer | Hero split avec mascottes + app mockup |
| `app/features/landing/components/LandingAppBridge.vue` | Créer | Bandeau "Tu utilises déjà dony ?" |
| `app/features/landing/components/LandingSteps.vue` | Créer | 3 étapes en cards |
| `app/features/landing/components/LandingTestimonials.vue` | Créer | 3 témoignages |
| `app/features/landing/components/LandingFeatures.vue` | Créer | 3 features en alternance |
| `app/features/landing/components/LandingFaq.vue` | Créer | FAQ accordéon 2 colonnes |
| `app/features/landing/components/LandingCta.vue` | Créer | CTA finale avec mascotte |
| `app/features/landing/components/LandingFooter.vue` | Créer | Footer 3 colonnes |
| `public/logos/logo-white-orange.png` | Copier | Logo navbar dark |
| `public/logos/logo-blue-orange.png` | Copier | Logo navbar light |
| `public/mascots/sur_avion.png` | Copier | Hero — mascotte principale |
| `public/mascots/pouce_leve.png` | Copier | Hero secondaire + CTA |
| `public/mascots/dans_avion.png` | Copier | Étape 2 |
| `public/mascots/colis_livre.png` | Copier | Étape 3 |
| `public/mascots/tenant_colis.png` | Copier | Étape 1 |
| `public/mascots/joyeux.png` | Copier | Fallback |

---

## Tâche 1 — Copier les assets Flutter vers `public/`

**Fichiers :**
- Créer : `public/logos/` + `public/mascots/`
- Copier depuis : `../dony_app/assets/logos/` et `../dony_app/assets/mascottes/`

- [ ] **Étape 1 : Créer les répertoires et copier les fichiers**

```bash
cd /home/a-diakite/Desktop/MyProject/my_app/dony-pro
mkdir -p public/logos public/mascots
cp ../dony_app/assets/logos/logo-white-orange.png public/logos/
cp ../dony_app/assets/logos/logo-blue-orange.png public/logos/
cp ../dony_app/assets/mascottes/sur_avion.png public/mascots/
cp ../dony_app/assets/mascottes/pouce_leve.png public/mascots/
cp ../dony_app/assets/mascottes/dans_avion.png public/mascots/
cp ../dony_app/assets/mascottes/colis_livre.png public/mascots/
cp ../dony_app/assets/mascottes/tenant_colis.png public/mascots/
cp ../dony_app/assets/mascotte/joyeux.png public/mascots/
```

- [ ] **Étape 2 : Vérifier la présence des fichiers**

```bash
ls public/logos/ public/mascots/
```

Attendu : 2 logos + 7 mascottes listés sans erreur.

- [ ] **Étape 3 : Commit**

```bash
git add public/logos/ public/mascots/
git commit -m "assets: copy logos and mascots from Flutter app to public/"
```

---

## Tâche 2 — Tokens design : `main.css` + `tailwind.config.ts`

**Fichiers :**
- Modifier : `assets/css/main.css`
- Modifier : `tailwind.config.ts`

- [ ] **Étape 1 : Mettre à jour `assets/css/main.css`**

Remplacer le contenu existant :

```css
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Light mode (défaut) */
:root {
  --bg:          #FAFAF8;
  --surface:     #FFFFFF;
  --surface-el:  #F2F1ED;
  --border:      #E8E5DF;
  --primary:     #0B5FFF;
  --primary-h:   #0A4DD9;
  --accent:      #D96A3A;
  --accent-h:    #B95524;
  --text:        #0A2540;
  --muted:       #54504A;
  --subtle:      #797367;
  --success:     #0E8A5F;
  --warning:     #E8A23B;
  --danger:      #D9342B;
}

/* Dark mode */
.dark {
  --bg:          #0A0E14;
  --surface:     #161B23;
  --surface-el:  #222932;
  --border:      #2D333D;
  --primary:     #4D8AFF;
  --primary-h:   #6699FF;
  --accent:      #E8865B;
  --accent-h:    #B95524;
  --text:        #F5F0E8;
  --muted:       #B5AFA5;
  --subtle:      #7E7972;
  --success:     #2DA677;
  --warning:     #F0B84A;
  --danger:      #EF5048;
}

html, body, #__nuxt {
  height: 100%;
  background-color: var(--bg);
  color: var(--text);
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  transition: background-color 0.3s ease, color 0.2s ease;
}

.font-display {
  font-family: 'Hanken Grotesk', system-ui, sans-serif;
}
```

- [ ] **Étape 2 : Mettre à jour `tailwind.config.ts`**

Remplacer le contenu existant :

```ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './app/components/**/*.{vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/features/**/*.vue',
    './app/app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        bg:           'var(--bg)',
        surface:      'var(--surface)',
        'surface-el': 'var(--surface-el)',
        'surface-elevated': 'var(--surface-el)',
        border:       'var(--border)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover:   'var(--primary-h)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-h)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted:   'var(--muted)',
          subtle:  'var(--subtle)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger:  'var(--danger)',
      },
      fontFamily: {
        display: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card:  '16px',
        btn:   '14px',
        sheet: '24px',
        sm:    '8px',
        full:  '999px',
      },
      spacing: {
        sidebar: '220px',
        topbar:  '64px',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Étape 3 : Vérifier que le build Tailwind compile sans erreur**

```bash
pnpm run build 2>&1 | head -30
```

Attendu : pas d'erreurs Tailwind. (Des erreurs de type TS non liées au CSS sont acceptables.)

- [ ] **Étape 4 : Commit**

```bash
git add assets/css/main.css tailwind.config.ts
git commit -m "style: update design tokens to exact Flutter app dark/light CSS variables"
```

---

## Tâche 3 — Thème : `nuxt.config.ts` + `useTheme.ts` + `ThemeToggle.vue`

**Fichiers :**
- Modifier : `nuxt.config.ts`
- Modifier : `app/layouts/default.vue`
- Créer : `app/composables/useTheme.ts`
- Créer : `app/components/ui/ThemeToggle.vue`

- [ ] **Étape 1 : Retirer `class: 'dark'` hardcodé de `nuxt.config.ts`**

Dans `nuxt.config.ts`, modifier la section `app.head` :

```ts
app: {
  head: {
    title: 'dony PRO',
    htmlAttrs: { lang: 'fr' },
    script: [
      {
        // Applique le thème avant le premier rendu pour éviter le flash
        innerHTML: `(function(){var s=localStorage.getItem('dony-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s===null&&d)){document.documentElement.classList.add('dark');}})();`,
        type: 'text/javascript',
      }
    ],
  },
},
```

- [ ] **Étape 2 : Forcer dark dans le layout cockpit `app/layouts/default.vue`**

Ajouter dans le `<script setup>` de `default.vue` (lire le fichier d'abord) :

```ts
// Force le dark mode dans le cockpit (app authentifiée)
onMounted(() => {
  document.documentElement.classList.add('dark')
})
```

- [ ] **Étape 3 : Créer `app/composables/useTheme.ts`**

```ts
export function useTheme() {
  const isDark = ref(false)

  onMounted(() => {
    isDark.value = document.documentElement.classList.contains('dark')

    const observer = new MutationObserver(() => {
      isDark.value = document.documentElement.classList.contains('dark')
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    onUnmounted(() => observer.disconnect())
  })

  return { isDark }
}
```

- [ ] **Étape 4 : Créer `app/components/ui/ThemeToggle.vue`**

```vue
<template>
  <button
    @click="toggle"
    :title="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
    class="p-2 rounded-sm text-text-muted hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    aria-label="Basculer le thème"
  >
    <!-- Soleil (mode clair actif = montrer soleil) -->
    <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
    <!-- Lune (mode sombre actif = montrer lune) -->
    <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
const isDark = ref(true)

onMounted(() => {
  const saved = localStorage.getItem('dony-theme')
  isDark.value = saved
    ? saved === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme()
})

function toggle() {
  isDark.value = !isDark.value
  localStorage.setItem('dony-theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>
```

- [ ] **Étape 5 : Commit**

```bash
git add nuxt.config.ts app/layouts/default.vue app/composables/useTheme.ts app/components/ui/ThemeToggle.vue
git commit -m "feat(theme): add system-aware dark/light toggle with localStorage persistence"
```

---

## Tâche 4 — Routing + layout + squelette de page

**Fichiers :**
- Modifier : `app/middleware/auth.global.ts`
- Créer : `app/layouts/landing.vue`
- Créer : `app/pages/landing.vue`

- [ ] **Étape 1 : Ajouter `/landing` aux routes publiques**

Dans `app/middleware/auth.global.ts`, modifier la ligne :

```ts
const PUBLIC_ROUTES = ['/login', '/upgrade', '/landing']
```

- [ ] **Étape 2 : Créer `app/layouts/landing.vue`**

```vue
<template>
  <div class="min-h-screen bg-bg text-text">
    <slot />
  </div>
</template>
```

- [ ] **Étape 3 : Créer `app/pages/landing.vue`** (squelette — les composants seront ajoutés tâche par tâche)

```vue
<template>
  <div>
    <LandingNav />
    <!-- blocs ajoutés dans les tâches suivantes -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })
</script>
```

- [ ] **Étape 4 : Vérifier que `/landing` est accessible sans auth**

```bash
pnpm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/landing
```

Attendu : `200` (pas de redirection vers `/login`).

- [ ] **Étape 5 : Commit**

```bash
git add app/middleware/auth.global.ts app/layouts/landing.vue app/pages/landing.vue
git commit -m "feat(landing): add public route, dedicated layout, and page skeleton"
```

---

## Tâche 5 — `LandingNav.vue`

**Fichiers :**
- Créer : `app/features/landing/components/LandingNav.vue`

- [ ] **Étape 1 : Créer le répertoire**

```bash
mkdir -p app/features/landing/components
```

- [ ] **Étape 2 : Créer `LandingNav.vue`**

```vue
<template>
  <nav
    class="fixed top-0 inset-x-0 z-50 border-b"
    style="backdrop-filter: blur(12px); background-color: color-mix(in srgb, var(--bg) 85%, transparent); border-color: color-mix(in srgb, var(--primary) 20%, transparent);"
  >
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <!-- Logo + badge PRO -->
      <div class="flex items-center gap-2.5">
        <img
          :src="isDark ? '/logos/logo-white-orange.png' : '/logos/logo-blue-orange.png'"
          alt="dony"
          class="h-7 w-auto"
        />
        <span
          class="text-[11px] font-bold font-sans px-2 py-0.5 rounded-full border"
          style="background-color: color-mix(in srgb, var(--primary) 10%, transparent); color: var(--primary); border-color: color-mix(in srgb, var(--primary) 25%, transparent);"
        >PRO</span>
      </div>

      <!-- Liens desktop -->
      <div class="hidden md:flex items-center gap-8">
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="text-sm font-medium text-text-muted hover:text-text transition-colors"
        >{{ link.label }}</a>
      </div>

      <!-- Droite : ThemeToggle + CTAs -->
      <div class="hidden md:flex items-center gap-2">
        <ThemeToggle />
        <NuxtLink
          to="/login"
          class="text-sm font-medium text-text hover:text-primary transition-colors px-4 py-2 rounded-btn border border-border hover:border-primary"
        >Se connecter</NuxtLink>
        <NuxtLink
          to="/login"
          class="text-sm font-semibold bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-btn transition-colors"
        >Rejoindre dony PRO</NuxtLink>
      </div>

      <!-- Hamburger mobile -->
      <button
        @click="menuOpen = !menuOpen"
        class="md:hidden p-2 text-text-muted hover:text-text transition-colors"
        :aria-label="menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
      >
        <svg v-if="!menuOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Drawer mobile -->
    <div v-show="menuOpen" class="md:hidden bg-surface border-t border-border px-6 py-5 flex flex-col gap-4">
      <a
        v-for="link in navLinks"
        :key="link.href"
        :href="link.href"
        class="text-sm font-medium text-text-muted hover:text-text"
        @click="menuOpen = false"
      >{{ link.label }}</a>
      <div class="flex items-center gap-3 pt-2 border-t border-border">
        <ThemeToggle />
        <NuxtLink to="/login" class="text-sm font-medium text-text" @click="menuOpen = false">Se connecter</NuxtLink>
        <NuxtLink to="/login" class="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-btn" @click="menuOpen = false">Rejoindre</NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { isDark } = useTheme()
const menuOpen = ref(false)

const navLinks = [
  { href: '#comment-ca-marche', label: 'Comment ça marche' },
  { href: '#fonctionnalites',   label: 'Fonctionnalités' },
  { href: '#faq',               label: 'FAQ' },
]
</script>
```

- [ ] **Étape 3 : Ajouter `LandingNav` dans `app/pages/landing.vue`**

La page est déjà prête depuis la tâche 4. Vérifier visuellement que la nav s'affiche.

- [ ] **Étape 4 : Commit**

```bash
git add app/features/landing/components/LandingNav.vue
git commit -m "feat(landing): add sticky navbar with logo, PRO badge, nav links, and theme toggle"
```

---

## Tâche 6 — `LandingHero.vue`

**Fichiers :**
- Créer : `app/features/landing/components/LandingHero.vue`
- Modifier : `app/pages/landing.vue`

- [ ] **Étape 1 : Créer `LandingHero.vue`**

```vue
<template>
  <section
    class="relative pt-16 overflow-hidden"
    style="min-height: 100vh; display: flex; align-items: center;"
  >
    <!-- Fond radial + blobs -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div
        style="position:absolute;inset:0;background:radial-gradient(ellipse at 70% 30%, color-mix(in srgb, var(--primary) 14%, transparent) 0%, color-mix(in srgb, var(--accent) 5%, transparent) 40%, var(--bg) 65%);"
      />
      <div style="position:absolute;top:15%;left:10%;width:320px;height:320px;border-radius:50%;background:color-mix(in srgb,var(--primary) 8%,transparent);filter:blur(70px);" />
      <div style="position:absolute;bottom:20%;right:5%;width:260px;height:260px;border-radius:50%;background:color-mix(in srgb,var(--accent) 6%,transparent);filter:blur(70px);" />
    </div>

    <div class="relative max-w-6xl mx-auto px-6 w-full py-20 flex flex-col lg:flex-row items-center gap-12" style="gap: 40px;">
      <!-- Colonne gauche -->
      <div class="flex-1 flex flex-col gap-6 max-w-[540px]">
        <!-- Badge animé -->
        <div class="flex items-center gap-2 w-fit px-3 py-1.5 rounded-full border" style="background-color:color-mix(in srgb,var(--primary) 8%,transparent);border-color:color-mix(in srgb,var(--primary) 20%,transparent);">
          <span class="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
          <span class="text-xs font-medium text-text-muted">Paris · Lyon · Marseille → Dakar · Abidjan · Bamako</span>
        </div>

        <!-- Headline -->
        <h1 class="font-display font-extrabold leading-tight" style="font-size: clamp(36px, 5vw, 52px); color: var(--text);">
          Gérez. Encaissez.<br />
          <span style="color: var(--accent);">Soyez payés.</span>
        </h1>

        <!-- Sous-titre -->
        <p class="text-base text-text-muted leading-relaxed" style="max-width: 440px;">
          dony PRO est l'espace de gestion pour les voyageurs vérifiés. Publiez vos trajets, acceptez des colis, encaissez en sécurité — tout depuis le web.
        </p>

        <!-- CTAs -->
        <div class="flex flex-wrap gap-3">
          <NuxtLink
            to="/login"
            class="inline-flex items-center gap-2 font-semibold text-white bg-primary hover:bg-primary-hover px-6 py-3 rounded-btn transition-colors"
          >
            Accéder au cockpit
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </NuxtLink>
          <a
            href="#"
            class="inline-flex items-center gap-2 font-medium text-text border border-border hover:border-primary hover:text-primary px-6 py-3 rounded-btn transition-colors"
          >
            Voir la démo
          </a>
        </div>

        <!-- Trust chips -->
        <div class="flex flex-wrap gap-3 mt-2">
          <span v-for="chip in trustChips" :key="chip" class="text-xs font-medium text-text-muted px-3 py-1.5 rounded-full bg-surface-el border border-border">
            {{ chip }}
          </span>
        </div>
      </div>

      <!-- Colonne droite — mascottes + app mockup -->
      <div
        class="flex-shrink-0 relative hidden lg:block"
        style="width: 500px; height: 480px;"
      >
        <!-- App mockup (z-index 5) -->
        <div
          class="absolute bg-surface border border-border rounded-card overflow-hidden shadow-2xl"
          style="width:230px;top:0;left:0;z-index:5;transform:perspective(800px) rotateY(-6deg) rotateX(2deg);"
        >
          <div class="bg-surface-el px-3 py-2 border-b border-border flex items-center justify-between">
            <span class="text-[10px] font-bold text-primary">COCKPIT dony PRO</span>
            <span class="w-1.5 h-1.5 rounded-full bg-success" />
          </div>
          <div class="p-3 flex flex-col gap-2">
            <!-- KPI cards mock -->
            <div class="grid grid-cols-2 gap-1.5">
              <div class="bg-surface-el rounded-sm p-2">
                <div class="text-[9px] text-text-muted mb-0.5">Ce mois</div>
                <div class="text-sm font-bold font-display text-success">+1 240 €</div>
              </div>
              <div class="bg-surface-el rounded-sm p-2">
                <div class="text-[9px] text-text-muted mb-0.5">Colis actifs</div>
                <div class="text-sm font-bold font-display text-primary">7</div>
              </div>
            </div>
            <!-- Trajets mock -->
            <div class="text-[9px] font-semibold text-text-muted uppercase tracking-wide mt-1">Trajets récents</div>
            <div v-for="trip in mockTrips" :key="trip.route" class="flex items-center justify-between bg-surface-el rounded-sm px-2 py-1.5">
              <div>
                <div class="text-[10px] font-medium text-text">{{ trip.route }}</div>
                <div class="text-[9px] text-text-muted">{{ trip.date }}</div>
              </div>
              <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" :style="trip.style">{{ trip.status }}</span>
            </div>
            <!-- Barre de progression -->
            <div class="mt-1">
              <div class="flex justify-between text-[9px] text-text-muted mb-1">
                <span>Taux d'acceptation</span>
                <span class="text-success font-semibold">87 %</span>
              </div>
              <div class="h-1 bg-surface rounded-full overflow-hidden">
                <div class="h-full bg-success rounded-full" style="width:87%" />
              </div>
            </div>
          </div>
        </div>

        <!-- Mascotte principale sur_avion.png (z-index 3) -->
        <img
          src="/mascots/sur_avion.png"
          alt="Mascotte dony sur un avion"
          style="position:absolute;right:0;bottom:0;z-index:3;width:400px;height:auto;object-fit:contain;"
        />

        <!-- Notification flottante (z-index 20) -->
        <div
          class="absolute bg-surface border border-border rounded-card px-3 py-2 shadow-xl flex items-start gap-2"
          style="top:20px;right:10px;z-index:20;max-width:200px;animation:float 3s ease-in-out infinite;"
        >
          <span class="text-base">📦</span>
          <div>
            <div class="text-[11px] font-semibold text-text">Nouveau match !</div>
            <div class="text-[10px] text-text-muted">Paris → Dakar · 4.2 kg</div>
          </div>
        </div>

        <!-- Mascotte secondaire pouce_leve.png (z-index 6) -->
        <img
          src="/mascots/pouce_leve.png"
          alt="Mascotte dony pouce levé"
          style="position:absolute;bottom:20px;left:220px;z-index:6;width:100px;height:auto;object-fit:contain;"
        />
      </div>
    </div>

    <!-- Animation float -->
    <style>
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    @media (prefers-reduced-motion: reduce) {
      .animate-pulse { animation: none; }
      [style*="animation:float"] { animation: none !important; }
    }
    </style>
  </section>
</template>

<script setup lang="ts">
const trustChips = [
  '🔒 Paiements Stripe',
  '✓ KYC vérifié',
  '🛡 Fonds en séquestre',
]

const mockTrips = [
  { route: 'Paris → Dakar', date: '18 mai', status: 'Actif', style: 'background-color:color-mix(in srgb,var(--success) 15%,transparent);color:var(--success);' },
  { route: 'Lyon → Abidjan', date: '22 mai', status: 'Pending', style: 'background-color:color-mix(in srgb,var(--warning) 15%,transparent);color:var(--warning);' },
  { route: 'CDG → Bamako', date: '01 juin', status: 'Ouvert', style: 'background-color:color-mix(in srgb,var(--primary) 15%,transparent);color:var(--primary);' },
]
</script>
```

- [ ] **Étape 2 : Ajouter `LandingHero` dans `app/pages/landing.vue`**

```vue
<template>
  <div>
    <LandingNav />
    <LandingHero />
    <!-- blocs suivants -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })
</script>
```

- [ ] **Étape 3 : Vérifier visuellement le hero à `http://localhost:3000/landing`**

Contrôler : mascotte visible à droite, app mockup en perspective, notification flottante animée, badge pulsé, responsive mobile (colonne droite masquée sous 1024px).

- [ ] **Étape 4 : Commit**

```bash
git add app/features/landing/components/LandingHero.vue app/pages/landing.vue
git commit -m "feat(landing): add hero with split layout, mascottes, app mockup, and trust chips"
```

---

## Tâche 7 — `LandingAppBridge.vue`

**Fichiers :**
- Créer : `app/features/landing/components/LandingAppBridge.vue`

- [ ] **Étape 1 : Créer `LandingAppBridge.vue`**

```vue
<template>
  <section
    class="py-12 border-y"
    style="background:linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, transparent), color-mix(in srgb, var(--primary) 6%, transparent)); border-color: color-mix(in srgb, var(--accent) 15%, transparent);"
  >
    <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
      <!-- Gauche : explication -->
      <div class="flex items-start gap-4">
        <span class="text-3xl" aria-hidden="true">📱</span>
        <div>
          <h2 class="text-lg font-bold font-display text-text mb-1">
            Active ton espace PRO depuis l'application mobile
          </h2>
          <p class="text-sm text-text-muted max-w-md">
            dony PRO est une extension de l'app dony. L'accès se débloque après validation KYC.
          </p>
        </div>
      </div>

      <!-- Droite : étapes + CTA -->
      <div class="flex flex-col sm:flex-row items-center gap-5">
        <!-- Étapes -->
        <div class="flex items-center gap-2 text-sm text-text-muted flex-wrap justify-center">
          <span v-for="(step, i) in steps" :key="step" class="flex items-center gap-2">
            <span class="font-medium text-text">{{ step }}</span>
            <svg v-if="i < steps.length - 1" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </span>
        </div>
        <!-- Bouton -->
        <a
          href="https://dony.app"
          target="_blank"
          rel="noopener noreferrer"
          class="flex-shrink-0 inline-flex items-center gap-2 font-semibold text-white px-5 py-2.5 rounded-btn transition-colors"
          style="background-color: var(--accent);"
          @mouseover="($event.target as HTMLElement).style.backgroundColor = 'var(--accent-h)'"
          @mouseout="($event.target as HTMLElement).style.backgroundColor = 'var(--accent)'"
        >
          <span>📲</span> Télécharger l'app dony
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = ['Ouvre l\'app', 'Profil → PRO', 'Active']
</script>
```

- [ ] **Étape 2 : Ajouter dans `landing.vue` après `LandingHero`**

```vue
<LandingAppBridge />
```

- [ ] **Étape 3 : Commit**

```bash
git add app/features/landing/components/LandingAppBridge.vue app/pages/landing.vue
git commit -m "feat(landing): add app mobile bridge section"
```

---

## Tâche 8 — `LandingSteps.vue`

**Fichiers :**
- Créer : `app/features/landing/components/LandingSteps.vue`

- [ ] **Étape 1 : Créer `LandingSteps.vue`**

```vue
<template>
  <section id="comment-ca-marche" class="py-20">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center mb-12">
        <h2 class="font-display font-bold text-3xl text-text mb-3">Comment ça marche</h2>
        <p class="text-text-muted max-w-lg mx-auto">Trois étapes pour gérer ton activité de transporteur comme un professionnel.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="step in steps"
          :key="step.number"
          class="bg-surface rounded-card p-6 border border-border relative overflow-hidden"
        >
          <!-- Border-top colorée -->
          <div class="absolute top-0 left-0 right-0 h-0.5 rounded-t-card" :style="{ background: step.gradient }" />

          <!-- Numéro pill -->
          <div class="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mb-4" :style="{ background: step.pillBg, color: step.pillColor }">
            {{ step.number }}
          </div>

          <!-- Mascotte -->
          <img
            :src="step.mascot"
            :alt="step.mascotAlt"
            class="w-20 h-20 object-contain mb-4"
          />

          <h3 class="font-display font-bold text-lg text-text mb-2">{{ step.title }}</h3>
          <p class="text-sm text-text-muted leading-relaxed">{{ step.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = [
  {
    number: '1',
    gradient: 'linear-gradient(90deg, var(--primary), var(--primary-h))',
    pillBg: 'color-mix(in srgb, var(--primary) 15%, transparent)',
    pillColor: 'var(--primary)',
    mascot: '/mascots/tenant_colis.png',
    mascotAlt: 'Mascotte dony tenant un colis',
    title: 'Publie ton trajet',
    description: 'Déclare ta destination, ta date de départ et la capacité bagage disponible. En quelques minutes, ton annonce est visible.',
  },
  {
    number: '2',
    gradient: 'linear-gradient(90deg, var(--accent), var(--accent-h))',
    pillBg: 'color-mix(in srgb, var(--accent) 15%, transparent)',
    pillColor: 'var(--accent)',
    mascot: '/mascots/dans_avion.png',
    mascotAlt: 'Mascotte dony dans un avion',
    title: 'Accepte les demandes',
    description: 'Consulte les demandes d\'expéditeurs vérifiés, négocie directement dans l\'app, et confirme les colis que tu transportes.',
  },
  {
    number: '3',
    gradient: 'linear-gradient(90deg, var(--success), #22c55e)',
    pillBg: 'color-mix(in srgb, var(--success) 15%, transparent)',
    pillColor: 'var(--success)',
    mascot: '/mascots/colis_livre.png',
    mascotAlt: 'Mascotte dony livrant un colis',
    title: 'Livre et encaisse',
    description: 'Scanne le QR à la livraison. Les fonds en séquestre sont libérés automatiquement sur ton compte Stripe sous 48h.',
  },
]
</script>
```

- [ ] **Étape 2 : Ajouter dans `landing.vue`**

```vue
<LandingSteps />
```

- [ ] **Étape 3 : Commit**

```bash
git add app/features/landing/components/LandingSteps.vue app/pages/landing.vue
git commit -m "feat(landing): add 3-step how-it-works section with mascottes"
```

---

## Tâche 9 — `LandingTestimonials.vue`

**Fichiers :**
- Créer : `app/features/landing/components/LandingTestimonials.vue`

- [ ] **Étape 1 : Créer `LandingTestimonials.vue`**

```vue
<template>
  <section class="py-20" style="background-color: var(--surface-el);">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center mb-12">
        <h2 class="font-display font-bold text-3xl text-text mb-3">Ce qu'en disent les voyageurs</h2>
        <p class="text-text-muted">Ils gèrent leur activité depuis dony PRO.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="t in testimonials"
          :key="t.name"
          class="bg-surface rounded-card p-6 border border-border flex flex-col gap-4"
        >
          <!-- Étoiles -->
          <div class="flex gap-0.5" aria-label="5 étoiles sur 5">
            <span v-for="i in 5" :key="i" style="color: #F59E0B; font-size: 14px;">★</span>
          </div>

          <!-- Citation -->
          <blockquote class="relative">
            <span class="absolute -top-2 -left-1 font-display font-bold leading-none select-none" style="font-size: 40px; color: var(--primary); opacity: 0.4;">"</span>
            <p class="text-sm text-text leading-relaxed pt-3">{{ t.quote }}</p>
          </blockquote>

          <!-- Auteur -->
          <div class="flex items-center gap-3 mt-auto pt-4 border-t border-border">
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style="background: linear-gradient(135deg, var(--primary), var(--accent));"
            >{{ t.initials }}</div>
            <div>
              <div class="text-sm font-semibold text-text">{{ t.name }}</div>
              <div class="text-xs text-text-muted">{{ t.role }}</div>
            </div>
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-text-subtle mt-8">* Témoignages représentatifs — à remplacer par de vrais retours dès disponibles.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
const testimonials = [
  {
    quote: 'Avant, je gérais tout par WhatsApp. Maintenant j\'ai une vue claire sur mes trajets, mes paiements et mes colis. Le cockpit m\'a changé la vie.',
    name: 'Amadou D.',
    initials: 'AD',
    role: 'Voyageur Paris → Dakar · 3 ans',
  },
  {
    quote: 'Le paiement en séquestre m\'a convaincue. J\'avais peur de ne pas être payée après la livraison. Maintenant tout est sécurisé, je n\'ai plus d\'inquiétude.',
    name: 'Fatoumata K.',
    initials: 'FK',
    role: 'Voyageuse Lyon → Abidjan · 2 ans',
  },
  {
    quote: 'La fonctionnalité de matching est incroyable. Je reçois des demandes d\'expéditeurs vérifiés directement, sans chercher. Mon taux de remplissage a explosé.',
    name: 'Moussa C.',
    initials: 'MC',
    role: 'Voyageur Marseille → Bamako · 4 ans',
  },
]
</script>
```

- [ ] **Étape 2 : Ajouter dans `landing.vue`**

```vue
<LandingTestimonials />
```

- [ ] **Étape 3 : Commit**

```bash
git add app/features/landing/components/LandingTestimonials.vue app/pages/landing.vue
git commit -m "feat(landing): add testimonials section"
```

---

## Tâche 10 — `LandingFeatures.vue`

**Fichiers :**
- Créer : `app/features/landing/components/LandingFeatures.vue`

- [ ] **Étape 1 : Créer `LandingFeatures.vue`**

```vue
<template>
  <section id="fonctionnalites" class="py-20">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="font-display font-bold text-3xl text-text mb-3">Tout ce dont tu as besoin</h2>
        <p class="text-text-muted max-w-lg mx-auto">Un workspace pensé pour les voyageurs professionnels de la diaspora.</p>
      </div>

      <div class="flex flex-col gap-20">
        <div
          v-for="(feature, i) in features"
          :key="feature.title"
          class="flex flex-col lg:flex-row items-center gap-12"
          :class="{ 'lg:flex-row-reverse': i % 2 !== 0 }"
        >
          <!-- Texte -->
          <div class="flex-1 flex flex-col gap-5">
            <div class="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full text-sm font-semibold" :style="feature.badgeStyle">
              <span>{{ feature.icon }}</span>
              <span>{{ feature.badge }}</span>
            </div>
            <h3 class="font-display font-bold text-2xl text-text">{{ feature.title }}</h3>
            <p class="text-text-muted leading-relaxed">{{ feature.description }}</p>
            <ul class="flex flex-col gap-2 mt-2">
              <li v-for="item in feature.bullets" :key="item" class="flex items-start gap-2 text-sm text-text-muted">
                <span class="mt-0.5 flex-shrink-0" style="color: var(--success);">✓</span>
                {{ item }}
              </li>
            </ul>
          </div>

          <!-- Visuel -->
          <div class="flex-shrink-0 w-full lg:w-[380px]">
            <div class="bg-surface rounded-card border border-border p-5 shadow-lg" v-html="feature.visual" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    icon: '📊',
    badge: 'Cockpit opérationnel',
    badgeStyle: 'background-color:color-mix(in srgb,var(--primary) 10%,transparent);color:var(--primary);',
    title: 'Une vue 360° de ton activité',
    description: 'KPIs en temps réel, historique des trajets, revenus encaissés, taux d\'acceptation — tout au même endroit.',
    bullets: [
      'Revenus du mois en un coup d\'œil',
      'Suivi des colis actifs par trajet',
      'Export fiscal en un clic',
    ],
    visual: `<div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="background:color-mix(in srgb,var(--success) 10%,transparent);border-radius:12px;padding:12px;">
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">Revenus avril</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);font-family:'Hanken Grotesk',sans-serif;">3 240 €</div>
        </div>
        <div style="background:color-mix(in srgb,var(--primary) 10%,transparent);border-radius:12px;padding:12px;">
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">Colis actifs</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);font-family:'Hanken Grotesk',sans-serif;">12</div>
        </div>
      </div>
      <div style="background:var(--surface-el);border-radius:12px;padding:12px;">
        <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em;">Trajets récents</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--text);">Paris → Dakar</span><span style="color:var(--success);font-weight:600;">+680 €</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--text);">CDG → Abidjan</span><span style="color:var(--success);font-weight:600;">+530 €</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--text);">Lyon → Bamako</span><span style="color:var(--warning);font-weight:600;">En cours</span></div>
        </div>
      </div>
    </div>`,
  },
  {
    icon: '🤝',
    badge: 'Matching & négociation',
    badgeStyle: 'background-color:color-mix(in srgb,var(--accent) 10%,transparent);color:var(--accent);',
    title: 'Trouve les bons expéditeurs',
    description: 'dony te propose des expéditeurs vérifiés qui correspondent à ton trajet. Négocie le prix directement, sans intermédiaire.',
    bullets: [
      'Matching automatique basé sur ton trajet',
      'Chat intégré pour négocier le tarif',
      'Expéditeurs vérifiés KYC uniquement',
    ],
    visual: `<div style="display:flex;flex-direction:column;gap:8px;">
      <div style="background:var(--surface-el);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:11px;color:var(--muted);">Nouveau match</div>
          <div style="font-size:13px;font-weight:600;color:var(--text);">Paris → Dakar · 6 kg</div>
        </div>
        <span style="background:color-mix(in srgb,var(--success) 15%,transparent);color:var(--success);font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;">Vérifié ✓</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;padding:4px 0;">
        <div style="align-self:flex-start;background:color-mix(in srgb,var(--primary) 12%,transparent);border-radius:0 12px 12px 12px;padding:8px 12px;font-size:12px;color:var(--text);max-width:80%;">Je propose 45 € pour 6 kg ?</div>
        <div style="align-self:flex-end;background:var(--primary);border-radius:12px 0 12px 12px;padding:8px 12px;font-size:12px;color:white;max-width:80%;">Je fais 50 €, c'est mon dernier prix.</div>
        <div style="align-self:flex-start;background:color-mix(in srgb,var(--success) 12%,transparent);border-radius:0 12px 12px 12px;padding:8px 12px;font-size:12px;color:var(--success);max-width:80%;">✓ Accord ! Je confirme le paiement.</div>
      </div>
    </div>`,
  },
  {
    icon: '🔒',
    badge: 'Paiements sécurisés',
    badgeStyle: 'background-color:color-mix(in srgb,var(--success) 10%,transparent);color:var(--success);',
    title: 'Encaisse sans risque',
    description: 'Les fonds sont bloqués en séquestre Stripe dès la confirmation. Tu es payé automatiquement à la livraison confirmée.',
    bullets: [
      'Séquestre Stripe — fonds garantis avant le vol',
      'Libération automatique après scan QR livraison',
      'Protection en cas de litige via dony',
    ],
    visual: `<div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--primary) 15%,transparent);color:var(--primary);font-weight:700;flex-shrink:0;">1</div>
        <div style="font-size:12px;color:var(--text);">Expéditeur confirme · <span style="color:var(--success);font-weight:600;">Fonds bloqués</span></div>
      </div>
      <div style="width:2px;height:16px;background:var(--border);margin-left:15px;" />
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--warning) 15%,transparent);color:var(--warning);font-weight:700;flex-shrink:0;">2</div>
        <div style="font-size:12px;color:var(--text);">Tu transportes le colis · <span style="color:var(--warning);">En séquestre</span></div>
      </div>
      <div style="width:2px;height:16px;background:var(--border);margin-left:15px;" />
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--success) 15%,transparent);color:var(--success);font-weight:700;flex-shrink:0;">3</div>
        <div style="font-size:12px;color:var(--text);">Scan QR livraison · <span style="color:var(--success);font-weight:600;">Virement automatique</span></div>
      </div>
      <div style="background:color-mix(in srgb,var(--success) 8%,transparent);border:1px solid color-mix(in srgb,var(--success) 20%,transparent);border-radius:12px;padding:10px 12px;margin-top:4px;font-size:12px;color:var(--success);font-weight:600;">
        💰 +1 240 € virés sur ton compte Stripe
      </div>
    </div>`,
  },
]
</script>
```

- [ ] **Étape 2 : Ajouter dans `landing.vue`**

```vue
<LandingFeatures />
```

- [ ] **Étape 3 : Commit**

```bash
git add app/features/landing/components/LandingFeatures.vue app/pages/landing.vue
git commit -m "feat(landing): add alternating features section with CSS mockups"
```

---

## Tâche 11 — `LandingFaq.vue`

**Fichiers :**
- Créer : `app/features/landing/components/LandingFaq.vue`

- [ ] **Étape 1 : Créer `LandingFaq.vue`**

```vue
<template>
  <section id="faq" class="py-20" style="background-color: var(--surface-el);">
    <div class="max-w-6xl mx-auto px-6">
      <div class="flex flex-col lg:flex-row gap-12">
        <!-- Colonne gauche — intro fixe -->
        <div class="lg:w-60 flex-shrink-0">
          <h2 class="font-display font-bold text-3xl text-text mb-3">Questions fréquentes</h2>
          <p class="text-sm text-text-muted leading-relaxed">Tout ce qu'il faut savoir avant de rejoindre dony PRO.</p>
        </div>

        <!-- Colonne droite — accordéon -->
        <div class="flex-1 flex flex-col divide-y divide-border">
          <div
            v-for="item in faqItems"
            :key="item.question"
            class="py-5"
          >
            <button
              @click="toggle(item.question)"
              class="w-full flex items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              :aria-expanded="openItem === item.question"
            >
              <span class="font-semibold text-text">{{ item.question }}</span>
              <span
                class="flex-shrink-0 text-text-muted transition-transform duration-200"
                :style="openItem === item.question ? 'transform: rotate(180deg)' : ''"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </span>
            </button>

            <Transition
              enter-active-class="transition-all duration-200 ease-out overflow-hidden"
              leave-active-class="transition-all duration-150 ease-in overflow-hidden"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-96 opacity-100"
              leave-from-class="max-h-96 opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div v-show="openItem === item.question" class="mt-3 text-sm text-text-muted leading-relaxed pr-8">
                {{ item.answer }}
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const openItem = ref<string | null>(faqItems[0]?.question ?? null)

function toggle(question: string) {
  openItem.value = openItem.value === question ? null : question
}

const faqItems = [
  {
    question: 'C\'est quoi dony PRO ?',
    answer: 'dony PRO est l\'espace web réservé aux voyageurs vérifiés de l\'application dony. Il te permet de gérer tes trajets, tes demandes de transport, ta négociation avec les expéditeurs et tes paiements depuis un ordinateur.',
  },
  {
    question: 'Comment accéder à dony PRO ?',
    answer: 'L\'accès à dony PRO se débloque depuis l\'application mobile dony après validation de ton identité (KYC). Va dans Profil → PRO → Activer. Une fois activé, connecte-toi sur cette page avec ton numéro de téléphone.',
  },
  {
    question: 'Comment fonctionne le paiement sécurisé ?',
    answer: 'Les paiements transitent par Stripe, leader mondial du paiement en ligne. Dès qu\'un expéditeur confirme un envoi, les fonds sont bloqués en séquestre. Ils sont libérés sur ton compte Stripe automatiquement lorsque tu scans le QR code à la livraison.',
  },
  {
    question: 'Quelle commission prend dony ?',
    answer: 'dony prélève 12 % sur chaque transaction, déduits du montant versé à l\'expéditeur (application_fee_amount Stripe). Tu encaisses le montant négocié avec l\'expéditeur, sans surprise.',
  },
  {
    question: 'Que se passe-t-il en cas de litige ?',
    answer: 'En cas de problème à la livraison, dony dispose d\'une équipe de résolution des litiges. Les fonds restent en séquestre jusqu\'à résolution. Pour les cas non résolus sous 48h, dony peut forcer la libération ou rembourser l\'expéditeur selon les éléments fournis.',
  },
]
</script>
```

- [ ] **Étape 2 : Ajouter dans `landing.vue`**

```vue
<LandingFaq />
```

- [ ] **Étape 3 : Commit**

```bash
git add app/features/landing/components/LandingFaq.vue app/pages/landing.vue
git commit -m "feat(landing): add FAQ accordion section"
```

---

## Tâche 12 — `LandingCta.vue` + `LandingFooter.vue`

**Fichiers :**
- Créer : `app/features/landing/components/LandingCta.vue`
- Créer : `app/features/landing/components/LandingFooter.vue`

- [ ] **Étape 1 : Créer `LandingCta.vue`**

```vue
<template>
  <section
    class="py-20 border-t"
    style="background:linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, transparent), color-mix(in srgb, var(--accent) 6%, transparent)); border-color: color-mix(in srgb, var(--primary) 15%, transparent);"
  >
    <div class="max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-10">
      <!-- Gauche -->
      <div class="flex flex-col gap-5 max-w-lg">
        <h2 class="font-display font-bold text-3xl text-text leading-snug">
          Prêt à gérer ton activité comme un pro ?
        </h2>
        <p class="text-text-muted">
          Rejoins les voyageurs dony qui encaissent en sécurité, optimisent leur taux de remplissage et gagnent du temps sur la gestion.
        </p>
        <div class="flex flex-wrap gap-3">
          <NuxtLink
            to="/login"
            class="inline-flex items-center gap-2 font-semibold text-white bg-primary hover:bg-primary-hover px-6 py-3 rounded-btn transition-colors"
          >
            Accéder au cockpit
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </NuxtLink>
        </div>
        <div class="flex items-center gap-2 text-xs text-text-muted">
          <span>🔒</span>
          <span>Paiements sécurisés via Stripe · KYC requis depuis l'app mobile</span>
        </div>
      </div>

      <!-- Droite — mascotte -->
      <img
        src="/mascots/pouce_leve.png"
        alt="Mascotte dony pouce levé"
        class="w-48 h-auto object-contain flex-shrink-0 hidden lg:block"
        aria-hidden="true"
      />
    </div>
  </section>
</template>
```

- [ ] **Étape 2 : Créer `LandingFooter.vue`**

```vue
<template>
  <footer class="py-10 border-t border-border">
    <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <!-- Gauche : logo + copyright -->
      <div class="flex items-center gap-3">
        <img
          :src="isDark ? '/logos/logo-white-orange.png' : '/logos/logo-blue-orange.png'"
          alt="dony"
          class="h-6 w-auto"
        />
        <span class="text-xs text-text-muted">© {{ new Date().getFullYear() }} dony. Tous droits réservés.</span>
      </div>

      <!-- Centre : liens -->
      <nav class="flex flex-wrap items-center justify-center gap-4" aria-label="Liens du footer">
        <a
          v-for="link in footerLinks"
          :key="link.label"
          :href="link.href"
          class="text-xs text-text-muted hover:text-text transition-colors"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noopener noreferrer' : undefined"
        >{{ link.label }}</a>
      </nav>

      <!-- Droite : badge Stripe -->
      <div class="flex items-center gap-2 text-xs text-text-muted">
        <span>🔒</span>
        <span>Paiements Stripe</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { isDark } = useTheme()

const footerLinks = [
  { label: 'Confidentialité', href: '#' },
  { label: 'CGU', href: '#' },
  { label: 'Contact', href: '#' },
  { label: '📱 App mobile dony', href: 'https://dony.app', external: true },
]
</script>
```

- [ ] **Étape 3 : Ajouter les deux blocs dans `landing.vue`**

```vue
<LandingCta />
<LandingFooter />
```

- [ ] **Étape 4 : Commit**

```bash
git add app/features/landing/components/LandingCta.vue app/features/landing/components/LandingFooter.vue app/pages/landing.vue
git commit -m "feat(landing): add final CTA and footer sections"
```

---

## Tâche 13 — Assemblage final et vérification

**Fichiers :**
- Modifier : `app/pages/landing.vue` (version finale complète)

- [ ] **Étape 1 : Remplacer `landing.vue` par la version finale assemblée**

```vue
<template>
  <div>
    <LandingNav />

    <main>
      <LandingHero />
      <LandingAppBridge />
      <LandingSteps />
      <LandingTestimonials />
      <LandingFeatures />
      <LandingFaq />
      <LandingCta />
    </main>

    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useSeoMeta({
  title: 'dony PRO — Gérez. Encaissez. Soyez payés.',
  description: 'L\'espace de gestion pour les voyageurs vérifiés dony. Publiez vos trajets, acceptez des colis, encaissez en sécurité.',
  ogTitle: 'dony PRO',
  ogDescription: 'Gérez votre activité de transporteur depuis le web.',
})
</script>
```

- [ ] **Étape 2 : Démarrer le serveur de dev et inspecter visuellement**

```bash
pnpm run dev
```

Ouvrir `http://localhost:3000/landing` et vérifier :

- [ ] Navbar sticky avec logo adaptatif dark/light
- [ ] Bouton ThemeToggle fonctionnel (bascule dark/light sans flash)
- [ ] Hero : mascotte `sur_avion.png` visible (400px), app mockup en perspective, notification animée, mascotte `pouce_leve.png` présente
- [ ] Bandeau AppBridge visible et bouton accent
- [ ] 3 steps avec mascottes
- [ ] 3 témoignages en grid
- [ ] 3 features en alternance gauche/droite avec mockups CSS
- [ ] FAQ accordion fonctionnel (cliquer pour ouvrir/fermer)
- [ ] CTA finale avec mascotte
- [ ] Footer avec liens
- [ ] Responsive : réduire la fenêtre sous 768px — hero en colonne, hamburger affiché

- [ ] **Étape 3 : Vérifier l'accessibilité de base**

```bash
# Vérifier que /landing est accessible sans auth
curl -L -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/landing
```

Attendu : `200`

- [ ] **Étape 4 : Commit final**

```bash
git add app/pages/landing.vue
git commit -m "feat(landing): assemble complete landing page with SEO meta"
```

---

## Récapitulatif des commits attendus

1. `assets: copy logos and mascots from Flutter app to public/`
2. `style: update design tokens to exact Flutter app dark/light CSS variables`
3. `feat(theme): add system-aware dark/light toggle with localStorage persistence`
4. `feat(landing): add public route, dedicated layout, and page skeleton`
5. `feat(landing): add sticky navbar with logo, PRO badge, nav links, and theme toggle`
6. `feat(landing): add hero with split layout, mascottes, app mockup, and trust chips`
7. `feat(landing): add app mobile bridge section`
8. `feat(landing): add 3-step how-it-works section with mascottes`
9. `feat(landing): add testimonials section`
10. `feat(landing): add alternating features section with CSS mockups`
11. `feat(landing): add FAQ accordion section`
12. `feat(landing): add final CTA and footer sections`
13. `feat(landing): assemble complete landing page with SEO meta`
