<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { NegotiationThread } from '@/features/negociations/types'

const props = defineProps<{ thread: NegotiationThread }>()
const router = useRouter()

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'EN COURS',
  AWAITING_TRIP: 'ATT. TRAJET',
  AWAITING_PAYMENT: 'PAIEMENT',
  ACCEPTED: 'ACCEPTÉE',
  REJECTED: 'REFUSÉE',
  AUTO_REJECTED: 'TERMINÉ',
  EXPIRED: 'TERMINÉ',
}

const STATUS_PILL: Record<string, string> = {
  OPEN: 'bg-primary/10 text-primary',
  AWAITING_TRIP: 'bg-amber-500/15 text-amber-400',
  AWAITING_PAYMENT: 'bg-purple-500/15 text-purple-400',
  ACCEPTED: 'bg-green-500/15 text-green-400',
  REJECTED: 'bg-red-500/15 text-red-400',
  AUTO_REJECTED: 'bg-border text-text-muted',
  EXPIRED: 'bg-border text-text-muted',
}

const STRIP_CLASS: Record<string, string> = {
  OPEN: 'bg-primary',
  AWAITING_TRIP: 'bg-amber-400',
  AWAITING_PAYMENT: 'bg-purple-400',
  ACCEPTED: 'bg-green-400',
  REJECTED: 'bg-red-400',
  AUTO_REJECTED: 'bg-border',
  EXPIRED: 'bg-border',
}

const PRICE_LABEL: Record<string, string> = {
  OPEN: 'proposition',
  AWAITING_TRIP: 'accord',
  AWAITING_PAYMENT: 'à payer',
  ACCEPTED: 'payé',
  REJECTED: 'terminé',
  AUTO_REJECTED: 'terminé',
  EXPIRED: 'terminé',
}

const isTerminal = computed(() =>
  ['REJECTED', 'AUTO_REJECTED', 'EXPIRED'].includes(props.thread.status),
)

const isMyTurn = computed(() => {
  if (props.thread.status !== 'OPEN') return false
  const msgs = props.thread.messages
  if (msgs.length === 0) return false
  return msgs[msgs.length - 1].fromUserId !== props.thread.travelerId
})

const senderInitials = computed(() => {
  const parts = props.thread.senderName.split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : props.thread.senderName.slice(0, 2).toUpperCase()
})

const runDate = computed(() =>
  props.thread.travelerTravelDate
    ? new Date(props.thread.travelerTravelDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    : null,
)

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return "à l'instant"
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}
</script>

<template>
  <div
    :data-test="`neg-card-${thread.id}`"
    class="relative overflow-hidden bg-surface border rounded-card cursor-pointer transition-all hover:border-primary/40"
    :class="isTerminal ? 'border-border/50 opacity-70' : 'border-border'"
    @click="router.push(`/negociations/${thread.id}`)"
  >
    <!-- Bande colorée gauche par statut -->
    <div
      class="absolute left-0 top-0 bottom-0 w-1 rounded-l-card"
      :class="STRIP_CLASS[thread.status] ?? 'bg-border'"
    />

    <div class="pl-4 pr-3 py-3 space-y-2.5">
      <!-- Ligne 1 : route + prix -->
      <div class="flex items-start justify-between gap-2">
        <p class="text-sm font-extrabold text-text tracking-tight">
          {{ thread.departureCity }} → {{ thread.arrivalCity }}
        </p>
        <div class="text-right flex-shrink-0">
          <p class="text-lg font-extrabold text-text leading-none tracking-tight">
            {{ thread.currentPriceEur }} €
          </p>
          <p class="text-[10px] text-text-muted font-semibold">
            {{ PRICE_LABEL[thread.status] ?? '' }}
          </p>
        </div>
      </div>

      <!-- Ligne 2 : avatar expéditeur + nom + statut pill -->
      <div class="flex items-center gap-1.5">
        <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span class="text-[9px] font-bold text-primary">{{ senderInitials }}</span>
        </div>
        <span class="text-xs font-semibold text-text-muted truncate flex-1">{{ thread.senderName }}</span>
        <span
          class="flex-shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full tracking-wide"
          :class="STATUS_PILL[thread.status] ?? 'bg-border text-text-muted'"
        >
          {{ STATUS_LABEL[thread.status] ?? thread.status }}
        </span>
      </div>

      <!-- Ligne 3 : rounds dots + méta + badge NOUVEAU -->
      <div class="flex items-center gap-1">
        <div
          v-for="i in 5"
          :key="i"
          class="h-0.5 w-4 rounded-full"
          :class="i <= thread.roundsCount
            ? (isTerminal ? 'bg-text-muted/40' : 'bg-text')
            : 'bg-border'"
        />
        <span class="text-[11px] text-text-muted font-medium ml-1 flex-1 truncate">
          R.{{ thread.roundsCount }}/5
          <template v-if="runDate"> · ✈ {{ runDate }}</template>
          · {{ timeAgo(thread.lastActivityAt) }}
        </span>
        <span
          v-if="isMyTurn"
          class="flex-shrink-0 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary text-white tracking-wide"
        >
          NOUVEAU
        </span>
      </div>

      <!-- Ligne 4 : action requise (AWAITING_TRIP) -->
      <p v-if="thread.status === 'AWAITING_TRIP'" class="text-xs text-amber-400 font-medium">
        ⚠ Action requise : liez un de vos trajets
      </p>
    </div>
  </div>
</template>
