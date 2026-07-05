<!-- app/features/colis/components/BidDetailPanel.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { X, Star, CheckCircle, XCircle, Mail, Clock, Copy, Package, Truck, MapPin } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { SectionLabel } from '@/components/ui/section-label'
import type { Bid, BidStatus } from '@/features/colis/types/index'

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

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

const paymentLabel: Record<Bid['paymentStatus'], string> = {
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
      class="fixed right-0 top-0 h-full w-[480px] max-w-full bg-surface border-l border-border z-50 flex flex-col shadow-pop"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <h2 class="text-lg font-bold text-text font-display">Détail du bid</h2>
        <button
          data-test="panel-close"
          class="p-2 rounded-btn text-text-muted hover:text-text hover:bg-surface-el transition-colors"
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
          <SectionLabel as="h3" class="mb-3">Expéditeur</SectionLabel>
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
                  :class="cn('w-3.5 h-3.5', i <= ratingStars ? 'text-warning fill-warning' : 'text-border')"
                />
                <span class="text-xs text-text-muted ml-1.5">
                  <span class="font-mono tabular-nums">{{ bid.sender.rating.toFixed(1) }}</span> · <span class="font-mono tabular-nums">{{ bid.sender.totalSentParcels }}</span> envois
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Bid info -->
        <section>
          <SectionLabel as="h3" class="mb-3">Détails du colis</SectionLabel>
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
              <dd class="text-sm text-text font-medium mt-0.5"><span class="font-mono tabular-nums">{{ bid.weightKg }}</span> kg</dd>
            </div>
            <div>
              <dt class="text-xs text-text-muted">Valeur déclarée</dt>
              <dd class="text-sm text-text font-medium mt-0.5"><span class="font-mono tabular-nums">{{ bid.declaredValueEuros }}</span> €</dd>
            </div>
            <div class="col-span-2">
              <dt class="text-xs text-text-muted">Contenu</dt>
              <dd class="text-sm text-text mt-0.5">{{ bid.contentDescription }}</dd>
            </div>
          </dl>
        </section>

        <!-- Tracking -->
        <section v-if="bid.trackingNumber || ['ACCEPTED','HANDED_OVER','IN_TRANSIT','COMPLETED'].includes(bid.status)">
          <SectionLabel as="h3" class="mb-3">Suivi du colis</SectionLabel>

          <!-- Numéro de suivi -->
          <div v-if="bid.trackingNumber" class="flex items-center gap-3 bg-bg border border-border rounded-el px-4 py-3 mb-4">
            <Package class="w-4 h-4 text-primary shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs text-text-muted">Numéro de suivi</p>
              <p class="font-mono font-bold text-text tracking-widest text-sm mt-0.5">{{ bid.trackingNumber }}</p>
            </div>
            <button
              class="p-1.5 rounded hover:bg-surface-el transition-colors text-text-muted hover:text-primary"
              title="Copier le numéro"
              type="button"
              @click="copyToClipboard(bid.trackingNumber!)"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>

          <!-- Timeline statut -->
          <ol class="relative">
            <li
              v-for="(step, i) in [
                { key: 'ACCEPTED',    label: 'Bid accepté',      icon: CheckCircle },
                { key: 'HANDED_OVER', label: 'Colis remis',       icon: Package },
                { key: 'IN_TRANSIT',  label: 'En transit',        icon: Truck },
                { key: 'COMPLETED',   label: 'Livré',             icon: MapPin },
              ]"
              :key="step.key"
              class="flex items-start gap-3 pb-4 last:pb-0"
            >
              <div class="flex flex-col items-center shrink-0">
                <div :class="cn(
                  'w-7 h-7 rounded-full flex items-center justify-center border-2',
                  ['ACCEPTED','HANDED_OVER','IN_TRANSIT','COMPLETED'].indexOf(bid.status) >= i
                    ? 'bg-primary border-primary text-on-primary'
                    : 'bg-bg border-border text-text-muted'
                )">
                  <component :is="step.icon" class="w-3.5 h-3.5" />
                </div>
                <div v-if="i < 3" class="w-0.5 h-4 mt-1" :class="
                  ['ACCEPTED','HANDED_OVER','IN_TRANSIT','COMPLETED'].indexOf(bid.status) > i
                    ? 'bg-primary'
                    : 'bg-border'
                " />
              </div>
              <p :class="cn(
                'text-sm pt-0.5',
                ['ACCEPTED','HANDED_OVER','IN_TRANSIT','COMPLETED'].indexOf(bid.status) >= i
                  ? 'text-text font-medium'
                  : 'text-text-muted'
              )">{{ step.label }}</p>
            </li>
          </ol>
        </section>

        <!-- Payment status -->
        <section>
          <SectionLabel as="h3" class="mb-3">Paiement</SectionLabel>
          <div class="flex items-center justify-between bg-bg rounded-el px-4 py-3 border border-border">
            <span class="text-sm text-text-muted">{{ paymentLabel[bid.paymentStatus] }}</span>
            <span class="text-sm font-mono font-bold tabular-nums text-primary">{{ bid.paymentAmountEuros.toFixed(2) }} €</span>
          </div>
          <p class="text-xs text-text-muted mt-2">
            Vos revenus nets (après commission 12 %) : <span class="text-primary font-mono font-semibold tabular-nums">{{ bid.earningsEuros.toFixed(2) }} €</span>
          </p>
        </section>

        <!-- History -->
        <section>
          <SectionLabel as="h3" class="mb-3">Historique</SectionLabel>
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
        v-if="bid.status === 'PAYMENT_ESCROWED'"
        class="flex-shrink-0 px-6 py-4 border-t border-border flex items-center gap-3"
      >
        <button
          data-test="panel-btn-accept"
          class="flex-1 flex items-center justify-center gap-2 h-10 rounded-btn bg-success text-on-primary text-sm font-medium shadow-btn hover:bg-success/90 transition-colors"
          @click="emit('accept', bid.id)"
        >
          <CheckCircle class="w-4 h-4" />
          Accepter
        </button>
        <button
          data-test="panel-btn-reject"
          class="flex-1 flex items-center justify-center gap-2 h-10 rounded-btn border border-danger text-danger text-sm font-medium hover:bg-danger/10 transition-colors"
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
