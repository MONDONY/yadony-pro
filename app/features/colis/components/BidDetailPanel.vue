<!-- app/features/colis/components/BidDetailPanel.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { X, Star, CheckCircle, XCircle, Mail, Clock } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Bid, BidStatus } from '@/features/colis/types/index'

const props = defineProps<{
  bid: Bid | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  'close': []
  'accept': [id: string]
  'reject': [id: string]
}>()

const statusLabel: Record<BidStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Accepté',
  REFUSED: 'Refusé',
  IN_TRANSIT: 'En transit',
  DELIVERED: 'Livré',
  DISPUTE: 'Litige',
}

const paymentLabel: Record<string, string> = {
  PENDING: 'En attente de paiement',
  ESCROWED: 'Paiement sécurisé (escrow)',
  RELEASED: 'Virement effectué',
  REFUNDED: 'Remboursé',
}

const ratingStars = computed(() => (props.bid ? Math.round(props.bid.sender.rating) : 0))

const sortedHistory = computed(() => {
  if (!props.bid) return []
  return [...props.bid.history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
})

function formatHistoryDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <!-- Backdrop -->
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 z-40"
      data-test="panel-backdrop"
      @click="emit('close')"
    />
  </Transition>

  <!-- Slide-over panel -->
  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-250 ease-in"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div
      v-if="isOpen && bid"
      data-test="bid-detail-panel"
      class="fixed right-0 top-0 h-full w-[480px] max-w-full bg-surface border-l border-border z-50 flex flex-col shadow-2xl"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <h2 class="text-lg font-bold text-text font-display">Détail du bid</h2>
        <button
          data-test="panel-close"
          class="p-2 rounded-btn text-text-muted hover:text-text hover:bg-border transition-colors"
          aria-label="Fermer"
          @click="emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        <!-- Sender profile -->
        <section>
          <h3 class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Expéditeur</h3>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-base font-bold text-primary flex-shrink-0">
              {{ bid.sender.avatarInitials }}
            </div>
            <div>
              <p class="font-semibold text-text">{{ bid.sender.name }}</p>
              <div class="flex items-center gap-0.5 mt-0.5">
                <Star
                  v-for="i in 5"
                  :key="i"
                  :class="cn('w-3.5 h-3.5', i <= ratingStars ? 'text-amber-400 fill-amber-400' : 'text-border')"
                />
                <span class="text-xs text-text-muted ml-1.5">
                  {{ bid.sender.rating.toFixed(1) }} · {{ bid.sender.totalSentParcels }} envois
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Bid info -->
        <section>
          <h3 class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Détails du colis</h3>
          <dl class="grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
              <dt class="text-xs text-text-muted">Corridor</dt>
              <dd class="text-sm text-text font-medium mt-0.5">{{ bid.tripCorridor }}</dd>
            </div>
            <div>
              <dt class="text-xs text-text-muted">Date départ</dt>
              <dd class="text-sm text-text font-medium mt-0.5">
                {{ new Date(bid.tripDepartureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-text-muted">Poids</dt>
              <dd class="text-sm text-text font-medium mt-0.5">{{ bid.weightKg }} kg</dd>
            </div>
            <div>
              <dt class="text-xs text-text-muted">Valeur déclarée</dt>
              <dd class="text-sm text-text font-medium mt-0.5">{{ bid.declaredValueEuros }} €</dd>
            </div>
            <div class="col-span-2">
              <dt class="text-xs text-text-muted">Contenu</dt>
              <dd class="text-sm text-text mt-0.5">{{ bid.contentDescription }}</dd>
            </div>
          </dl>
        </section>

        <!-- Payment status -->
        <section>
          <h3 class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Paiement</h3>
          <div class="flex items-center justify-between bg-bg rounded-card px-4 py-3 border border-border">
            <span class="text-sm text-text-muted">{{ paymentLabel[bid.paymentStatus] }}</span>
            <span class="text-sm font-bold text-accent">{{ bid.paymentAmountEuros.toFixed(2) }} €</span>
          </div>
          <p class="text-xs text-text-muted mt-2">
            Vos revenus nets (après commission 12 %) : <span class="text-accent font-semibold">{{ bid.earningsEuros.toFixed(2) }} €</span>
          </p>
        </section>

        <!-- History -->
        <section>
          <h3 class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Historique</h3>
          <ol class="relative space-y-3 border-l border-border ml-2">
            <li
              v-for="(entry, i) in sortedHistory"
              :key="i"
              class="pl-5 relative"
            >
              <span class="absolute left-0 top-1 -translate-x-[calc(50%+0.5px)] w-2 h-2 rounded-full bg-primary border border-bg" />
              <div class="flex items-start gap-2">
                <Clock class="w-3.5 h-3.5 text-text-muted mt-0.5 flex-shrink-0" />
                <div>
                  <p class="text-xs text-text-muted">{{ formatHistoryDate(entry.date) }}</p>
                  <p class="text-sm text-text font-medium">{{ statusLabel[entry.status] }}</p>
                  <p v-if="entry.note" class="text-xs text-text-muted mt-0.5">{{ entry.note }}</p>
                </div>
              </div>
            </li>
          </ol>
        </section>
      </div>

      <!-- Sticky footer actions -->
      <div
        v-if="bid.status === 'PENDING'"
        class="flex-shrink-0 px-6 py-4 border-t border-border flex items-center gap-3"
      >
        <button
          data-test="panel-btn-accept"
          class="flex-1 flex items-center justify-center gap-2 h-10 rounded-btn bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
          @click="emit('accept', bid.id)"
        >
          <CheckCircle class="w-4 h-4" />
          Accepter
        </button>
        <button
          data-test="panel-btn-reject"
          class="flex-1 flex items-center justify-center gap-2 h-10 rounded-btn border border-red-400 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
          @click="emit('reject', bid.id)"
        >
          <XCircle class="w-4 h-4" />
          Refuser
        </button>
        <a
          :href="`mailto:${bid.sender.id}@dony.fr`"
          data-test="panel-btn-contact"
          class="h-10 w-10 flex items-center justify-center rounded-btn border border-border text-text-muted hover:text-text hover:border-primary/50 transition-colors"
          aria-label="Contacter l'expéditeur"
        >
          <Mail class="w-4 h-4" />
        </a>
      </div>
    </div>
  </Transition>
</template>
