<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import type { MatchingRequest } from '@/features/demandes/types/index'

/**
 * Ligne « liste » d'une demande compatible (variante compacte de
 * MatchingRequestCard). Reconstruit d'après l'usage dans MatchingDashboard.
 */
const props = defineProps<{
  request: MatchingRequest
  isNegotiating: boolean
  hasNegotiated: boolean
}>()

const emit = defineEmits<{
  negotiate: [request: MatchingRequest]
  'view-detail': [request: MatchingRequest]
}>()

const scoreVariant = computed<BadgeVariants['variant']>(() => {
  if (props.request.matchScore >= 85) return 'success'
  if (props.request.matchScore >= 60) return 'warning'
  return 'neutral'
})
</script>

<template>
  <div
    :data-test="`request-row-${request.id}`"
    class="flex items-center gap-4 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-el"
  >
    <!-- Expéditeur -->
    <div class="flex min-w-0 flex-[2] items-center gap-3">
      <img
        v-if="request.senderAvatarUrl"
        :src="request.senderAvatarUrl"
        :alt="request.senderName"
        class="h-9 w-9 shrink-0 rounded-full object-cover"
      />
      <div v-else class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <span class="text-xs font-semibold text-primary">{{ request.senderInitials }}</span>
      </div>
      <div class="min-w-0">
        <p class="truncate text-sm font-medium text-text">{{ request.senderName }}</p>
        <p class="truncate text-xs text-text-subtle">
          <span class="font-mono tabular-nums">{{ request.senderRating.toFixed(1) }}</span> ★ ·
          <span class="font-mono tabular-nums">{{ request.senderTotalSent }}</span> envois
        </p>
      </div>
    </div>

    <!-- Contenu -->
    <div class="hidden flex-1 truncate text-sm text-text-muted md:block">{{ request.contentType }}</div>

    <!-- Poids -->
    <div class="hidden w-20 text-right font-mono text-sm tabular-nums text-text sm:block">{{ request.weightKg }} kg</div>

    <!-- Budget -->
    <div class="w-24 text-right font-mono text-sm tabular-nums text-text">{{ request.budgetPerKg }} €/kg</div>

    <!-- Score -->
    <div class="w-16 text-right">
      <Badge :variant="scoreVariant" size="sm" class="font-mono tabular-nums">{{ request.matchScore }}%</Badge>
    </div>

    <!-- Actions -->
    <div class="flex w-40 items-center justify-end gap-2">
      <button
        :data-test="`row-detail-${request.id}`"
        type="button"
        class="text-xs text-primary transition-colors hover:underline"
        @click="emit('view-detail', request)"
      >
        Détails
      </button>
      <button
        v-if="hasNegotiated"
        :data-test="`row-negotiated-${request.id}`"
        type="button"
        disabled
        class="h-8 cursor-default rounded-btn bg-success/10 px-3 text-xs font-semibold text-success"
      >
        Envoyée
      </button>
      <button
        v-else
        :data-test="`row-negotiate-${request.id}`"
        type="button"
        :disabled="isNegotiating"
        :class="cn(
          'h-8 rounded-btn px-3 text-xs font-semibold transition-colors',
          isNegotiating
            ? 'cursor-not-allowed bg-surface-el text-text-muted'
            : 'bg-primary text-on-primary shadow-btn hover:bg-primary-hover',
        )"
        @click="emit('negotiate', request)"
      >
        {{ isNegotiating ? 'Ouverture…' : 'Négocier' }}
      </button>
    </div>
  </div>
</template>
