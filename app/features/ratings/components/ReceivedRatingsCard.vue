<!-- app/features/ratings/components/ReceivedRatingsCard.vue -->
<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import type { RatingsSummary } from '@/features/ratings/types/index'

defineProps<{
  summary: RatingsSummary | null
  isLoading: boolean
}>()

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <section class="bg-surface border border-border rounded-card p-5 space-y-4">
    <header>
      <h2 class="font-display font-semibold text-base text-text">Notes reçues</h2>
      <p class="text-sm text-text-muted">Ce que les expéditeurs disent de toi.</p>
    </header>

    <!-- Chargement -->
    <div v-if="isLoading" class="space-y-3" data-test="ratings-loading">
      <div v-for="i in 3" :key="i" class="h-14 bg-border rounded animate-pulse" />
    </div>

    <template v-else-if="summary">
      <!-- Résumé -->
      <div class="flex items-center gap-3">
        <span class="font-display text-3xl font-bold text-text font-mono tabular-nums">
          {{ summary.averageRating !== null ? Number(summary.averageRating).toFixed(1) : '—' }}
        </span>
        <div>
          <div class="flex items-center gap-0.5">
            <Star
              v-for="n in 5"
              :key="n"
              class="w-4 h-4"
              :class="summary.averageRating !== null && n <= Math.round(Number(summary.averageRating)) ? 'text-warning fill-warning' : 'text-border-strong'"
            />
          </div>
          <p class="text-xs text-text-muted">{{ summary.ratingCount }} note{{ summary.ratingCount > 1 ? 's' : '' }}</p>
        </div>
      </div>

      <!-- État vide -->
      <p v-if="summary.ratings.length === 0" class="text-sm text-text-muted" data-test="ratings-empty">
        Pas encore de note — elles apparaîtront après tes premières livraisons.
      </p>

      <!-- Liste -->
      <ul v-else class="divide-y divide-border">
        <li v-for="(r, i) in summary.ratings" :key="i" class="py-3 space-y-1">
          <div class="flex items-center gap-2">
            <span class="flex items-center gap-0.5">
              <Star v-for="n in 5" :key="n" class="w-3.5 h-3.5" :class="n <= r.stars ? 'text-warning fill-warning' : 'text-border-strong'" />
            </span>
            <span class="text-xs font-medium text-text">{{ r.authorName ?? 'Anonyme' }}</span>
            <span v-if="r.departureCity && r.arrivalCity" class="text-xs text-text-subtle">
              {{ r.departureCity }} → {{ r.arrivalCity }}
            </span>
            <span class="ml-auto text-2xs text-text-subtle">{{ formatDate(r.createdAt) }}</span>
          </div>
          <p v-if="r.comment" class="text-sm text-text-muted">{{ r.comment }}</p>
        </li>
      </ul>
    </template>
  </section>
</template>
