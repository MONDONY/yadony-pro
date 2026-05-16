<!-- app/features/trajets/components/TripDetailBids.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CheckCircle, XCircle, Download, List, Table2, PackageCheck } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { TripBid } from '@/features/trajets/types/index'

const props = defineProps<{
  bids: TripBid[]
  isLoading: boolean
  loadingBidId?: string | null
}>()

const emit = defineEmits<{
  'accept': [bidId: string]
  'reject': [bidId: string]
  'confirm-delivery': [bidId: string, code: string]
  'export-csv': []
}>()

const confirmingBid = ref<TripBid | null>(null)
const confirmCode = ref('')

function openConfirmModal(bid: TripBid) {
  confirmingBid.value = bid
  confirmCode.value = ''
}

function closeConfirmModal() {
  confirmingBid.value = null
  confirmCode.value = ''
}

function submitConfirmDelivery() {
  if (!confirmingBid.value || confirmCode.value.length !== 6) return
  emit('confirm-delivery', confirmingBid.value.id, confirmCode.value)
}

watch(() => props.loadingBidId, (newVal, oldVal) => {
  if (oldVal === confirmingBid.value?.id && newVal === null) {
    closeConfirmModal()
  }
})

type BidViewMode = 'cards' | 'table'
const viewMode = ref<BidViewMode>('cards')

type StatusFilter = 'TOUS' | 'PAYMENT_ESCROWED' | 'ACCEPTED' | 'IN_TRANSIT' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
const statusFilters: Array<{ key: StatusFilter; label: string }> = [
  { key: 'TOUS', label: 'Tous' },
  { key: 'PAYMENT_ESCROWED', label: 'À traiter' },
  { key: 'ACCEPTED', label: 'Acceptés' },
  { key: 'IN_TRANSIT', label: 'En transit' },
  { key: 'COMPLETED', label: 'Livrés' },
  { key: 'REJECTED', label: 'Refusés' },
  { key: 'CANCELLED', label: 'Annulés' },
]

const STATUS_LABELS: Record<string, string> = {
  AWAITING_PAYMENT: 'Paiement attendu',
  PENDING: 'En attente',
  PAYMENT_ESCROWED: 'À traiter',
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

const STATUS_CLASSES: Record<string, string> = {
  AWAITING_PAYMENT: 'bg-amber-500/20 text-amber-400',
  PENDING: 'bg-border text-text-muted',
  PAYMENT_ESCROWED: 'bg-blue-500/20 text-blue-400',
  ACCEPTED: 'bg-green-500/20 text-green-400',
  HANDED_OVER: 'bg-teal-500/20 text-teal-400',
  IN_TRANSIT: 'bg-indigo-500/20 text-indigo-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  CANCELLED: 'bg-border text-text-muted',
  COMPLETED: 'bg-green-600/20 text-green-500',
  NO_SHOW: 'bg-orange-500/20 text-orange-400',
  PARCEL_REFUSED: 'bg-red-600/20 text-red-500',
  EXPIRED: 'bg-border text-text-muted',
}

const activeStatusFilter = ref<StatusFilter>('TOUS')
const senderSearch = ref('')

const filteredBids = computed(() => {
  let result = props.bids
  if (activeStatusFilter.value !== 'TOUS') {
    result = result.filter((b) => b.status === activeStatusFilter.value)
  }
  const q = senderSearch.value.trim().toLowerCase()
  if (q) {
    result = result.filter((b) => b.senderName.toLowerCase().includes(q))
  }
  return result
})

const pendingCount = computed(() => props.bids.filter((b) => b.status === 'PAYMENT_ESCROWED').length)

</script>

<template>
  <div class="space-y-4">

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Status filter chips -->
      <div class="flex items-center gap-1 bg-surface rounded-btn p-1 border border-border overflow-x-auto">
        <button
          v-for="f in statusFilters"
          :key="f.key"
          :data-test="`bid-filter-${f.key}`"
          :class="cn(
            'flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap',
            activeStatusFilter === f.key ? 'bg-primary text-white' : 'text-text-muted hover:text-text',
          )"
          @click="activeStatusFilter = f.key"
        >
          {{ f.label }}
          <span v-if="f.key === 'PAYMENT_ESCROWED' && pendingCount > 0" class="ml-1 bg-amber-400 text-black rounded-full px-1.5 py-0.5 text-[10px] font-bold">
            {{ pendingCount }}
          </span>
        </button>
      </div>

      <!-- Sender search -->
      <input
        v-model="senderSearch"
        type="text"
        placeholder="Rechercher un expéditeur…"
        data-test="bid-sender-search"
        class="h-9 px-3 rounded-btn bg-surface border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors min-w-[180px]"
      />

      <div class="ml-auto flex items-center gap-2">
        <!-- View mode toggle -->
        <div class="flex items-center gap-1 bg-surface border border-border rounded-btn p-1">
          <button
            :class="['p-1.5 rounded transition-colors', viewMode === 'cards' ? 'bg-primary text-white' : 'text-text-muted hover:text-text']"
            aria-label="Vue cartes"
            data-test="view-cards"
            @click="viewMode = 'cards'"
          >
            <List class="w-4 h-4" />
          </button>
          <button
            :class="['p-1.5 rounded transition-colors', viewMode === 'table' ? 'bg-primary text-white' : 'text-text-muted hover:text-text']"
            aria-label="Vue tableau"
            data-test="view-table"
            @click="viewMode = 'table'"
          >
            <Table2 class="w-4 h-4" />
          </button>
        </div>

        <!-- Export CSV -->
        <button
          data-test="btn-export-csv"
          class="flex items-center gap-1.5 h-9 px-3 rounded-btn border border-border text-sm text-text-muted hover:text-text hover:border-primary/50 transition-colors"
          @click="emit('export-csv')"
        >
          <Download class="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-24 bg-surface border border-border rounded-card animate-pulse" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredBids.length === 0"
      class="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-card text-center"
    >
      <p class="text-text-muted text-sm">Aucun colis pour ce filtre.</p>
    </div>

    <!-- Table view -->
    <div v-else-if="viewMode === 'table'" class="bg-surface border border-border rounded-card overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border bg-bg">
            <th class="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Expéditeur</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Poids</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Valeur</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Contenu</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Revenus nets</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Statut</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="bid in filteredBids"
            :key="bid.id"
            class="hover:bg-bg/50 transition-colors"
            :data-test="`bid-row-${bid.id}`"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {{ bid.senderInitials }}
                </div>
                <div>
                  <p class="font-medium text-text">{{ bid.senderName }}</p>
                  <p class="text-xs text-text-muted">{{ bid.senderTotalShipments }} envois</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-text font-medium">{{ bid.weightKg }} kg</td>
            <td class="px-4 py-3 text-text-muted">{{ bid.declaredValueEuros }} €</td>
            <td class="px-4 py-3 text-text-muted max-w-[150px] truncate">{{ bid.contentDescription || '—' }}</td>
            <td class="px-4 py-3 text-accent font-semibold">{{ bid.earningsEuros.toFixed(2) }} €</td>
            <td class="px-4 py-3">
              <span :class="cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_CLASSES[bid.status] ?? 'bg-border text-text-muted')">
                {{ STATUS_LABELS[bid.status] ?? bid.status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div v-if="bid.status === 'PAYMENT_ESCROWED'" class="flex items-center gap-1.5">
                <button
                  :disabled="props.loadingBidId === bid.id"
                  class="p-1.5 rounded text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                  :data-test="`accept-${bid.id}`"
                  @click="emit('accept', bid.id)"
                >
                  <CheckCircle class="w-4 h-4" />
                </button>
                <button
                  :disabled="props.loadingBidId === bid.id"
                  class="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  :data-test="`reject-${bid.id}`"
                  @click="emit('reject', bid.id)"
                >
                  <XCircle class="w-4 h-4" />
                </button>
              </div>
              <div v-else-if="bid.status === 'IN_TRANSIT'">
                <button
                  :disabled="props.loadingBidId === bid.id"
                  class="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-indigo-400 border border-indigo-400/30 hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                  :data-test="`confirm-delivery-${bid.id}`"
                  @click="openConfirmModal(bid)"
                >
                  <PackageCheck class="w-3.5 h-3.5" />
                  Livraison
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cards view -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="bid in filteredBids"
        :key="bid.id"
        class="bg-surface border border-border rounded-card p-4 space-y-3"
        :data-test="`bid-card-${bid.id}`"
      >
        <!-- Sender + status -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {{ bid.senderInitials }}
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-text truncate">{{ bid.senderName }}</p>
              <p class="text-xs text-text-muted">{{ bid.senderTotalShipments }} envois</p>
            </div>
          </div>
          <span :class="cn('flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium', STATUS_CLASSES[bid.status] ?? 'bg-border text-text-muted')">
            {{ STATUS_LABELS[bid.status] ?? bid.status }}
          </span>
        </div>

        <!-- Details grid -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-bg rounded-btn px-2 py-2">
            <p class="text-sm font-bold text-text">{{ bid.weightKg }} kg</p>
            <p class="text-xs text-text-muted">Poids</p>
          </div>
          <div class="bg-bg rounded-btn px-2 py-2">
            <p class="text-sm font-bold text-text">{{ bid.declaredValueEuros }} €</p>
            <p class="text-xs text-text-muted">Valeur</p>
          </div>
          <div class="bg-bg rounded-btn px-2 py-2">
            <p class="text-sm font-bold text-accent">{{ bid.earningsEuros.toFixed(2) }} €</p>
            <p class="text-xs text-text-muted">Revenus nets</p>
          </div>
        </div>

        <!-- Content description -->
        <p v-if="bid.contentDescription" class="text-xs text-text-muted">
          Contenu : {{ bid.contentDescription }}
        </p>

        <!-- Actions PAYMENT_ESCROWED -->
        <div v-if="bid.status === 'PAYMENT_ESCROWED'" class="flex items-center gap-2 pt-1">
          <button
            :disabled="props.loadingBidId === bid.id"
            class="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-btn bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            :data-test="`accept-card-${bid.id}`"
            @click="emit('accept', bid.id)"
          >
            <CheckCircle class="w-3.5 h-3.5" />
            Accepter
          </button>
          <button
            :disabled="props.loadingBidId === bid.id"
            class="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-btn border border-red-400 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
            :data-test="`reject-card-${bid.id}`"
            @click="emit('reject', bid.id)"
          >
            <XCircle class="w-3.5 h-3.5" />
            Refuser
          </button>
        </div>

        <!-- Action IN_TRANSIT : confirmer la livraison -->
        <div v-else-if="bid.status === 'IN_TRANSIT'" class="pt-1">
          <button
            :disabled="props.loadingBidId === bid.id"
            class="w-full flex items-center justify-center gap-1.5 h-9 rounded-btn border border-indigo-400/50 text-indigo-400 text-xs font-medium hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
            :data-test="`confirm-delivery-card-${bid.id}`"
            @click="openConfirmModal(bid)"
          >
            <PackageCheck class="w-3.5 h-3.5" />
            Confirmer la livraison
          </button>
        </div>
      </div>
    </div>

    <!-- Footer count -->
    <p v-if="!isLoading && filteredBids.length > 0" class="text-xs text-text-muted text-right">
      {{ filteredBids.length }} colis affichés · {{ props.bids.length }} au total
    </p>
  </div>

  <!-- Modale confirmation de livraison -->
  <Teleport to="body">
    <div
      v-if="confirmingBid"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="closeConfirmModal"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div class="relative w-full max-w-sm bg-surface border border-border rounded-card shadow-2xl p-6 space-y-5">

        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <PackageCheck class="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 class="font-semibold text-text text-sm">Confirmer la livraison</h3>
              <p class="text-xs text-text-muted mt-0.5">Colis de {{ confirmingBid.senderName }}</p>
            </div>
          </div>
          <button
            class="text-text-muted hover:text-text transition-colors p-1"
            @click="closeConfirmModal"
          >
            <XCircle class="w-4 h-4" />
          </button>
        </div>

        <!-- Instruction -->
        <p class="text-xs text-text-muted leading-relaxed">
          Entrez le code à 6 chiffres que l'expéditeur vous a communiqué pour valider la remise du colis au destinataire.
        </p>

        <!-- Code input -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-text-muted">Code de confirmation</label>
          <input
            v-model="confirmCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
            data-test="confirm-delivery-code-input"
            class="w-full h-12 px-4 rounded-btn bg-bg border border-border text-text text-center text-lg font-mono tracking-[0.4em] placeholder:text-text-muted/40 focus:outline-none focus:border-primary transition-colors"
            @keyup.enter="submitConfirmDelivery"
          />
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2.5 pt-1">
          <button
            class="flex-1 h-10 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
            @click="closeConfirmModal"
          >
            Annuler
          </button>
          <button
            :disabled="confirmCode.length !== 6 || props.loadingBidId === confirmingBid.id"
            class="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-btn bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-test="confirm-delivery-submit"
            @click="submitConfirmDelivery"
          >
            <span v-if="props.loadingBidId === confirmingBid.id" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <CheckCircle v-else class="w-4 h-4" />
            Confirmer
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
