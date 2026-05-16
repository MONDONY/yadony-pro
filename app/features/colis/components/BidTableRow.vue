<!-- app/features/colis/components/BidTableRow.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Star, CheckCircle, XCircle, Eye, Copy } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Bid, BidStatus } from '@/features/colis/types/index'

function copyTracking(trackingNumber: string) {
  navigator.clipboard.writeText(trackingNumber).catch(() => {})
}

const props = defineProps<{
  bid: Bid
  isSelected: boolean
}>()

const emit = defineEmits<{
  'toggle-select': [id: string]
  'open-detail': [bid: Bid]
  'accept': [id: string]
  'reject': [id: string]
}>()

const statusLabel: Record<BidStatus, string> = {
  AWAITING_PAYMENT: 'Paiement attendu',
  PENDING: 'En attente',
  PAYMENT_ESCROWED: 'Paiement sécurisé',
  ACCEPTED: 'Accepté',
  HANDED_OVER: 'Remis',
  IN_TRANSIT: 'En transit',
  REJECTED: 'Refusé',
  CANCELLED: 'Annulé',
  COMPLETED: 'Livré',
  NO_SHOW: 'Absent',
  PARCEL_REFUSED: 'Colis refusé',
  EXPIRED: 'Expiré',
}

const statusClass: Record<BidStatus, string> = {
  AWAITING_PAYMENT: 'bg-amber-500/15 text-amber-300',
  PENDING: 'bg-amber-500/15 text-amber-400',
  PAYMENT_ESCROWED: 'bg-blue-500/15 text-blue-400',
  ACCEPTED: 'bg-green-500/15 text-green-400',
  HANDED_OVER: 'bg-green-600/15 text-green-500',
  IN_TRANSIT: 'bg-[#0B5FFF]/15 text-[#0B5FFF]',
  REJECTED: 'bg-red-500/15 text-red-400',
  CANCELLED: 'bg-[#1E2A4A] text-[#A8A294]',
  COMPLETED: 'bg-[#0B5FFF]/15 text-[#0B5FFF]',
  NO_SHOW: 'bg-red-700/20 text-red-300',
  PARCEL_REFUSED: 'bg-red-700/20 text-red-300',
  EXPIRED: 'bg-[#1E2A4A] text-[#A8A294]',
}

const formattedDate = computed(() => {
  const d = new Date(props.bid.tripDepartureDate)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
})

const ratingStars = computed(() => Math.round(props.bid.sender.rating))
</script>

<template>
  <tr
    :data-test="`bid-row-${bid.id}`"
    :class="cn(
      'border-b border-border transition-colors',
      isSelected ? 'bg-primary/5' : 'hover:bg-surface',
    )"
  >
    <!-- Checkbox -->
    <td class="w-10 pl-4 py-3">
      <input
        type="checkbox"
        :data-test="`row-checkbox-${bid.id}`"
        :checked="isSelected"
        class="w-4 h-4 rounded accent-primary cursor-pointer"
        @change="emit('toggle-select', bid.id)"
      />
    </td>

    <!-- Sender -->
    <td class="py-3 pr-4">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
          {{ bid.sender.avatarInitials }}
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium text-text truncate">{{ bid.sender.name }}</p>
          <div class="flex items-center gap-0.5">
            <Star
              v-for="i in 5"
              :key="i"
              :class="cn('w-3 h-3', i <= ratingStars ? 'text-amber-400 fill-amber-400' : 'text-border')"
            />
            <span class="text-xs text-text-muted ml-1">{{ bid.sender.rating.toFixed(1) }}</span>
          </div>
        </div>
      </div>
    </td>

    <!-- Tracking number -->
    <td class="py-3 pr-4">
      <div v-if="bid.trackingNumber" class="flex items-center gap-1.5">
        <span class="font-mono text-xs bg-bg border border-border rounded px-1.5 py-0.5 text-text tracking-wider">
          {{ bid.trackingNumber }}
        </span>
        <button
          class="text-text-muted hover:text-primary transition-colors p-0.5 rounded"
          :title="`Copier ${bid.trackingNumber}`"
          type="button"
          @click.stop="copyTracking(bid.trackingNumber!)"
        >
          <Copy class="w-3 h-3" />
        </button>
      </div>
      <span v-else class="text-xs text-text-muted">—</span>
    </td>

    <!-- Corridor -->
    <td class="py-3 pr-4 text-sm text-text-muted whitespace-nowrap">
      {{ bid.tripCorridor }}
    </td>

    <!-- Departure date -->
    <td class="py-3 pr-4 text-sm text-text-muted whitespace-nowrap">
      {{ formattedDate }}
    </td>

    <!-- Weight -->
    <td class="py-3 pr-4 text-sm text-text">
      {{ bid.weightKg }} kg
    </td>

    <!-- Content -->
    <td class="py-3 pr-4 text-sm text-text-muted max-w-[160px]">
      <span class="truncate block">{{ bid.contentDescription }}</span>
    </td>

    <!-- Status -->
    <td class="py-3 pr-4">
      <span :class="cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', statusClass[bid.status])">
        {{ statusLabel[bid.status] }}
      </span>
    </td>

    <!-- Earnings -->
    <td class="py-3 pr-4 text-sm font-semibold text-accent whitespace-nowrap">
      {{ bid.earningsEuros.toFixed(2) }} €
    </td>

    <!-- Actions -->
    <td class="py-3 pr-4">
      <div class="flex items-center gap-1">
        <button
          :data-test="`btn-detail-${bid.id}`"
          class="p-1.5 rounded text-text-muted hover:text-text hover:bg-border transition-colors"
          aria-label="Voir le détail"
          @click="emit('open-detail', bid)"
        >
          <Eye class="w-4 h-4" />
        </button>
        <button
          v-if="bid.status === 'PAYMENT_ESCROWED'"
          :data-test="`btn-accept-${bid.id}`"
          class="p-1.5 rounded text-green-400 hover:bg-green-500/10 transition-colors"
          aria-label="Accepter"
          @click="emit('accept', bid.id)"
        >
          <CheckCircle class="w-4 h-4" />
        </button>
        <button
          v-if="bid.status === 'PAYMENT_ESCROWED'"
          :data-test="`btn-reject-${bid.id}`"
          class="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label="Refuser"
          @click="emit('reject', bid.id)"
        >
          <XCircle class="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
</template>
