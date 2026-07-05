<script setup lang="ts">
import { computed } from 'vue'
import { X, Package } from 'lucide-vue-next'
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import type { MatchingRequest } from '@/features/demandes/types/index'

/**
 * Modal de détail d'une demande de colis. S'affiche quand `request` est non
 * nul. Reconstruit d'après l'usage dans MatchingDashboard (@close/@negotiate).
 */
const props = defineProps<{ request: MatchingRequest | null }>()
const emit = defineEmits<{
  close: []
  negotiate: [request: MatchingRequest]
}>()

const scoreVariant = computed<BadgeVariants['variant']>(() => {
  const s = props.request?.matchScore ?? 0
  if (s >= 85) return 'success'
  if (s >= 60) return 'warning'
  return 'neutral'
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="request"
      class="fixed inset-0 z-50 flex items-center justify-center bg-text/40 p-4"
      data-test="request-detail-modal"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-lg overflow-hidden rounded-card border border-border bg-surface shadow-pop">
        <!-- En-tête -->
        <div class="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span class="text-sm font-semibold text-primary">{{ request.senderInitials }}</span>
            </div>
            <div>
              <h2 class="font-display text-base font-semibold text-text">{{ request.senderName }}</h2>
              <p class="text-xs text-text-subtle">
                <span class="font-mono tabular-nums">{{ request.senderRating.toFixed(1) }}</span> ★ ·
                <span class="font-mono tabular-nums">{{ request.senderTotalSent }}</span> envois
              </p>
            </div>
          </div>
          <button
            type="button"
            data-test="detail-close"
            class="rounded-btn p-1.5 text-text-muted transition-colors hover:bg-surface-el hover:text-text"
            aria-label="Fermer"
            @click="emit('close')"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <!-- Corps -->
        <div class="flex flex-col gap-4 p-5">
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-2 text-sm text-text-muted">
              <Package class="h-4 w-4 text-text-subtle" :stroke-width="1.75" aria-hidden="true" />
              {{ request.contentType }}
            </span>
            <Badge :variant="scoreVariant" size="sm" class="font-mono tabular-nums">{{ request.matchScore }}% compatible</Badge>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-el bg-surface-el p-3 text-center">
              <p class="text-2xs text-text-muted">Poids</p>
              <p class="mt-0.5 font-mono text-lg font-semibold tabular-nums text-text">{{ request.weightKg }} kg</p>
            </div>
            <div class="rounded-el bg-surface-el p-3 text-center">
              <p class="text-2xs text-text-muted">Budget</p>
              <p class="mt-0.5 font-mono text-lg font-semibold tabular-nums text-text">{{ request.budgetPerKg }} €/kg</p>
            </div>
          </div>

          <p v-if="request.messageExcerpt" class="text-sm italic leading-relaxed text-text-muted">
            « {{ request.messageExcerpt }} »
          </p>
        </div>

        <!-- Pied -->
        <div class="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            class="rounded-btn border border-border-strong px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-el"
            @click="emit('close')"
          >
            Fermer
          </button>
          <button
            type="button"
            data-test="detail-negotiate"
            class="rounded-btn bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-btn transition-colors hover:bg-primary-hover"
            @click="emit('negotiate', request)"
          >
            Négocier
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
