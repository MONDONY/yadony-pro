<script setup lang="ts">
import { Lock, BadgeCheck, Smartphone } from 'lucide-vue-next'

const items = [
  {
    icon: Lock,
    tone: 'text-primary bg-primary/10',
    title: 'Paiements sécurisés via Stripe',
    subtitle: 'Fonds en séquestre jusqu\'à la livraison confirmée',
  },
  {
    icon: BadgeCheck,
    tone: 'text-success bg-success/10',
    title: 'Identité vérifiée (KYC)',
    subtitle: 'Tous les membres sont validés avant d\'accéder à la plateforme',
  },
  {
    icon: Smartphone,
    tone: 'text-primary bg-primary/10',
    title: 'Connexion par code SMS',
    subtitle: 'Sans mot de passe — plus simple, plus sûr',
  },
]
</script>

<template>
  <div class="relative flex w-1/2 shrink-0 flex-col border-r border-border bg-surface-el p-10">
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <span class="font-display text-2xl font-semibold tracking-tight text-text">dony</span>
      <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">PRO</span>
    </div>

    <!-- Accroche éditoriale -->
    <div class="flex flex-1 flex-col justify-center py-10">
      <h2 class="max-w-sm font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-text text-balance">
        L'espace de gestion des voyageurs vérifiés.
      </h2>
      <p class="mt-3 max-w-sm text-sm leading-relaxed text-text-muted">
        Publiez vos trajets, acceptez des colis et suivez vos encaissements en séquestre — en toute confiance.
      </p>
    </div>

    <!-- Items de réassurance -->
    <div class="flex flex-col gap-2.5">
      <div
        v-for="item in items"
        :key="item.title"
        data-test="security-item"
        class="flex items-center gap-3 rounded-el border border-border bg-surface p-3 shadow-card"
      >
        <div :class="['flex h-8 w-8 shrink-0 items-center justify-center rounded-el', item.tone]">
          <component :is="item.icon" class="h-4 w-4" :stroke-width="1.75" aria-hidden="true" />
        </div>
        <div>
          <p class="text-xs font-semibold text-text">{{ item.title }}</p>
          <p class="mt-0.5 text-2xs leading-snug text-text-subtle">{{ item.subtitle }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
