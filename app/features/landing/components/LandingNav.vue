<template>
  <nav
    class="fixed top-0 inset-x-0 z-50 border-b"
    style="backdrop-filter: blur(12px); background-color: rgb(var(--bg-rgb) / 0.85); border-color: rgb(var(--primary-rgb) / 0.2);"
  >
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <!-- Logo + badge PRO -->
      <div class="flex items-center gap-2.5">
        <img
          :src="isDark ? logoWhite : logoBlue"
          alt="yadony"
          class="h-7 w-auto"
        />
        <span
          class="text-[11px] font-bold font-sans px-2 py-0.5 rounded-full border"
          style="background-color: rgb(var(--primary-rgb) / 0.1); color: var(--primary); border-color: rgb(var(--primary-rgb) / 0.25);"
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
        type="button"
        @click="menuOpen = !menuOpen"
        class="md:hidden p-2 text-text-muted hover:text-text transition-colors"
        :aria-expanded="menuOpen"
        :aria-label="menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
      >
        <svg v-if="!menuOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
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
        <NuxtLink to="/login" class="text-sm font-semibold bg-primary text-on-primary px-4 py-2 rounded-btn" @click="menuOpen = false">Rejoindre</NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import ThemeToggle from '@/components/ui/ThemeToggle.vue'

const { isDark } = useTheme()
const menuOpen = ref(false)
const logoWhite = useAssetUrl('logos/logo-white-orange.png')
const logoBlue = useAssetUrl('logos/logo-blue-orange.png')

const navLinks = [
  { href: '#comment-ca-marche', label: 'Comment ça marche' },
  { href: '#fonctionnalites',   label: 'Fonctionnalités' },
  { href: '#faq',               label: 'FAQ' },
]
</script>
