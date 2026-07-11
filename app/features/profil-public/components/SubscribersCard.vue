<!-- app/features/profil-public/components/SubscribersCard.vue -->
<script setup lang="ts">
import { UsersRound } from 'lucide-vue-next'
import type { Subscriber } from '@/features/profil-public/services/subscribersService'

defineProps<{
  subscribers: Subscriber[]
  isLoading: boolean
}>()

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}
</script>

<template>
  <section class="bg-surface border border-border rounded-card p-5 space-y-4">
    <header class="flex items-center justify-between">
      <div>
        <h2 class="font-display font-semibold text-base text-text">Mes abonnés</h2>
        <p class="text-sm text-text-muted">Les expéditeurs alertés à chacun de tes nouveaux trajets.</p>
      </div>
      <span class="font-display text-2xl font-bold text-text font-mono tabular-nums">{{ subscribers.length }}</span>
    </header>

    <div v-if="isLoading" class="space-y-2" data-test="subscribers-loading">
      <div v-for="i in 3" :key="i" class="h-10 bg-border rounded animate-pulse" />
    </div>

    <div
      v-else-if="subscribers.length === 0"
      class="flex flex-col items-center py-8 text-center"
      data-test="subscribers-empty"
    >
      <UsersRound class="w-7 h-7 text-text-subtle mb-2" />
      <p class="text-sm text-text-muted">Pas encore d'abonné — publie régulièrement pour fidéliser tes expéditeurs.</p>
    </div>

    <ul v-else class="divide-y divide-border">
      <li v-for="s in subscribers" :key="s.senderId" class="flex items-center gap-3 py-2.5">
        <span class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
          {{ initials(s.displayName) }}
        </span>
        <span class="text-sm text-text">{{ s.displayName }}</span>
        <span class="ml-auto text-xs text-text-subtle">abonné depuis le {{ formatDate(s.subscribedAt) }}</span>
      </li>
    </ul>
  </section>
</template>
