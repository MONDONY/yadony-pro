<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { cn } from '@/lib/utils'
import type { NegotiationThread } from '@/features/negociations/types'

const props = defineProps<{ thread: NegotiationThread }>()
const router = useRouter()

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'En cours',
  AWAITING_TRIP: 'Trajet à lier',
  AWAITING_PAYMENT: 'En attente paiement',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  AUTO_REJECTED: 'Non retenue',
  EXPIRED: 'Expirée',
}

const STATUS_CLASS: Record<string, string> = {
  OPEN: 'bg-blue-500/15 text-blue-400',
  AWAITING_TRIP: 'bg-amber-500/15 text-amber-400',
  AWAITING_PAYMENT: 'bg-purple-500/15 text-purple-400',
  ACCEPTED: 'bg-green-500/15 text-green-400',
  REJECTED: 'bg-red-500/15 text-red-400',
  AUTO_REJECTED: 'bg-border text-text-muted',
  EXPIRED: 'bg-border text-text-muted',
}

const isActive = computed(() =>
  ['OPEN', 'AWAITING_TRIP', 'AWAITING_PAYMENT'].includes(props.thread.status),
)

const lastMessage = computed(() =>
  props.thread.messages[props.thread.messages.length - 1] ?? null,
)

const formattedDate = computed(() =>
  new Date(props.thread.lastActivityAt).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }),
)
</script>

<template>
  <div
    :data-test="`neg-card-${thread.id}`"
    class="p-4 bg-surface border rounded-card space-y-3 cursor-pointer transition-all hover:border-primary/40"
    :class="isActive ? 'border-border' : 'border-border/50 opacity-70'"
    @click="router.push(`/negociations/${thread.id}`)"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="text-sm font-semibold text-text truncate">
          {{ thread.departureCity }} → {{ thread.arrivalCity }}
        </p>
        <p class="text-xs text-text-muted mt-0.5">{{ thread.weightKg }} kg · {{ formattedDate }}</p>
      </div>
      <span
        :class="cn('flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full', STATUS_CLASS[thread.status] ?? 'bg-border text-text-muted')"
      >
        {{ STATUS_LABEL[thread.status] ?? thread.status }}
      </span>
    </div>

    <!-- Prix courant -->
    <div class="flex items-center gap-4">
      <div class="bg-bg rounded px-3 py-1.5 text-center">
        <p class="text-xs text-text-muted">Prix actuel</p>
        <p class="text-sm font-bold text-accent">{{ thread.currentPriceEur }} €</p>
      </div>
      <div class="bg-bg rounded px-3 py-1.5 text-center">
        <p class="text-xs text-text-muted">Échanges</p>
        <p class="text-sm font-bold text-text">{{ thread.roundsCount }}</p>
      </div>
    </div>

    <!-- Dernier message -->
    <p v-if="lastMessage?.body" class="text-xs text-text-muted italic truncate">
      "{{ lastMessage.body }}"
    </p>

    <!-- Badge action requise -->
    <div
      v-if="thread.status === 'AWAITING_TRIP'"
      class="text-xs text-amber-400 font-medium"
    >
      ⚠ Action requise : liez un de vos trajets
    </div>
  </div>
</template>
