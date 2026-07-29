<template>
  <footer class="py-10 border-t border-border">
    <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <!-- Logo + copyright -->
      <div class="flex items-center gap-3">
        <img
          src="/logos/logo-yadony.png"
          alt="Yadony"
          class="h-6 w-auto"
        />
        <span class="text-xs text-text-muted">© {{ currentYear }} Yadony. Tous droits réservés.</span>
      </div>

      <!-- Liens -->
      <nav class="flex flex-wrap items-center justify-center gap-4" aria-label="Liens du pied de page">
        <a
          v-for="link in footerLinks"
          :key="link.label"
          :href="link.href"
          class="text-xs text-text-muted hover:text-text transition-colors"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noopener noreferrer' : undefined"
        >{{ link.label }}</a>
      </nav>

      <!-- Badge Stripe -->
      <div class="flex items-center gap-2 text-xs text-text-muted flex-shrink-0">
        <span aria-hidden="true">🔒</span>
        <span>Paiements Stripe</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()

const footerLinks = [
  { label: 'Confidentialité', href: '#' },
  { label: 'CGU', href: '#' },
  { label: 'Contact', href: '#' },
  { label: '📱 App mobile Yadony', href: 'https://dony.app', external: true },
]
</script>
