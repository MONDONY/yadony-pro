<!-- app/features/trajets/components/TripDetailBids.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CheckCircle, XCircle, Download, List, Table2, PackageCheck, Inbox, QrCode, X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import TripBidDetailPanel from '@/features/trajets/components/TripBidDetailPanel.vue'
import QrScanner from '@/features/trajets/components/QrScanner.vue'
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
  'confirm-presence': [bidId: string]
  'refuse-parcel': [bidId: string, reason: string, photo: File | null]
  'cancel': [bidId: string]
  'tracking-event': [bidId: string, eventType: 'DEPART' | 'TRANSIT' | 'ARRIVEE']
  'export-csv': []
}>()

// Panneau de détail d'un colis (ouvert au clic sur une carte/ligne).
const detailBid = ref<TripBid | null>(null)

function onPanelRequestDelivery(bid: TripBid) {
  detailBid.value = null
  openConfirmModal(bid)
}
function forwardAndClose(fn: () => void) {
  fn()
  detailBid.value = null
}

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

const scanningBid = ref<TripBid | null>(null)

function openScan(bid: TripBid) {
  scanningBid.value = bid
}

function closeScan() {
  scanningBid.value = null
}

function onScanDetected() {
  // Le QR du colis confirme la présence à la remise → on enregistre la prise en charge.
  if (!scanningBid.value) return
  emit('tracking-event', scanningBid.value.id, 'DEPART')
  closeScan()
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

const STATUS_VARIANT: Record<string, BadgeVariants['variant']> = {
  AWAITING_PAYMENT: 'warning',
  PENDING: 'neutral',
  PAYMENT_ESCROWED: 'info',
  ACCEPTED: 'success',
  HANDED_OVER: 'info',
  IN_TRANSIT: 'info',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
  COMPLETED: 'success',
  NO_SHOW: 'warning',
  PARCEL_REFUSED: 'danger',
  EXPIRED: 'neutral',
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
            activeStatusFilter === f.key ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text',
          )"
          @click="activeStatusFilter = f.key"
        >
          {{ f.label }}
          <span v-if="f.key === 'PAYMENT_ESCROWED' && pendingCount > 0" class="ml-1 bg-warning text-bg rounded-full px-1.5 py-0.5 text-[10px] font-mono font-semibold tabular-nums">
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
        class="h-9 px-3 rounded-input bg-surface border border-border-strong text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors min-w-[180px]"
      />

      <div class="ml-auto flex items-center gap-2">
        <!-- View mode toggle -->
        <div class="flex items-center gap-1 bg-surface border border-border rounded-btn p-1">
          <button
            :class="['p-1.5 rounded transition-colors', viewMode === 'cards' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text']"
            aria-label="Vue cartes"
            data-test="view-cards"
            @click="viewMode = 'cards'"
          >
            <List class="w-4 h-4" />
          </button>
          <button
            :class="['p-1.5 rounded transition-colors', viewMode === 'table' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text']"
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
          class="flex items-center gap-1.5 h-9 px-3 rounded-btn border border-border-strong text-sm text-text-muted hover:text-text hover:border-primary/50 transition-colors"
          @click="emit('export-csv')"
        >
          <Download class="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-24 rounded-el border border-border bg-surface shadow-card animate-pulse" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredBids.length === 0"
      class="rounded-el border border-dashed border-border"
    >
      <EmptyState :icon="Inbox" title="Aucun colis" description="Aucun colis ne correspond à ce filtre pour le moment." />
    </div>

    <!-- Table view -->
    <div v-else-if="viewMode === 'table'" class="rounded-card border border-border bg-surface shadow-card overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border bg-surface-el">
            <th class="text-left px-4 py-3 text-2xs font-semibold text-text-subtle uppercase tracking-[0.07em]">Expéditeur</th>
            <th class="text-left px-4 py-3 text-2xs font-semibold text-text-subtle uppercase tracking-[0.07em]">Poids</th>
            <th class="text-left px-4 py-3 text-2xs font-semibold text-text-subtle uppercase tracking-[0.07em]">Valeur</th>
            <th class="text-left px-4 py-3 text-2xs font-semibold text-text-subtle uppercase tracking-[0.07em]">Contenu</th>
            <th class="text-left px-4 py-3 text-2xs font-semibold text-text-subtle uppercase tracking-[0.07em]">Revenus nets</th>
            <th class="text-left px-4 py-3 text-2xs font-semibold text-text-subtle uppercase tracking-[0.07em]">Statut</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="bid in filteredBids"
            :key="bid.id"
            class="hover:bg-surface-el transition-colors cursor-pointer"
            :data-test="`bid-row-${bid.id}`"
            @click="detailBid = bid"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                  {{ bid.senderInitials }}
                </div>
                <div>
                  <p class="font-medium text-text">{{ bid.senderName }}</p>
                  <p class="text-xs text-text-muted"><span class="font-mono tabular-nums">{{ bid.senderTotalShipments }}</span> envois</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 font-mono tabular-nums text-text font-medium">{{ bid.weightKg }} kg</td>
            <td class="px-4 py-3 font-mono tabular-nums text-text-muted">{{ bid.declaredValueEuros }} €</td>
            <td class="px-4 py-3 text-text-muted max-w-[150px] truncate">{{ bid.contentDescription || '—' }}</td>
            <td class="px-4 py-3 font-mono tabular-nums text-primary font-semibold">{{ bid.earningsEuros.toFixed(2) }} €</td>
            <td class="px-4 py-3">
              <Badge :variant="STATUS_VARIANT[bid.status] ?? 'neutral'" size="sm">
                {{ STATUS_LABELS[bid.status] ?? bid.status }}
              </Badge>
            </td>
            <td class="px-4 py-3">
              <div v-if="bid.status === 'PAYMENT_ESCROWED'" class="flex items-center gap-1.5">
                <button
                  :disabled="props.loadingBidId === bid.id"
                  class="p-1.5 rounded-btn text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                  :data-test="`accept-${bid.id}`"
                  @click.stop="emit('accept', bid.id)"
                >
                  <CheckCircle class="w-4 h-4" />
                </button>
                <button
                  :disabled="props.loadingBidId === bid.id"
                  class="p-1.5 rounded-btn text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                  :data-test="`reject-${bid.id}`"
                  @click.stop="emit('reject', bid.id)"
                >
                  <XCircle class="w-4 h-4" />
                </button>
              </div>
              <div v-else-if="bid.status === 'ACCEPTED'">
                <button
                  :disabled="props.loadingBidId === bid.id"
                  class="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-primary border border-primary/30 hover:bg-primary/10 transition-colors disabled:opacity-50"
                  :data-test="`handover-${bid.id}`"
                  @click="emit('tracking-event', bid.id, 'DEPART')"
                >
                  <PackageCheck class="w-3.5 h-3.5" />
                  Prise en charge
                </button>
              </div>
              <div v-else-if="bid.status === 'HANDED_OVER'">
                <button
                  :disabled="props.loadingBidId === bid.id"
                  class="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-primary border border-primary/30 hover:bg-primary/10 transition-colors disabled:opacity-50"
                  :data-test="`transit-${bid.id}`"
                  @click="emit('tracking-event', bid.id, 'TRANSIT')"
                >
                  <PackageCheck class="w-3.5 h-3.5" />
                  En transit
                </button>
              </div>
              <div v-else-if="bid.status === 'IN_TRANSIT'">
                <button
                  :disabled="props.loadingBidId === bid.id"
                  class="flex items-center gap-1 px-2 py-1.5 rounded-btn text-xs font-medium text-primary border border-primary/30 hover:bg-primary/10 transition-colors disabled:opacity-50"
                  :data-test="`confirm-delivery-${bid.id}`"
                  @click.stop="openConfirmModal(bid)"
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
        class="rounded-el border border-border bg-surface p-4 shadow-card space-y-3 cursor-pointer hover:border-primary/40 transition-colors"
        :data-test="`bid-card-${bid.id}`"
        @click="detailBid = bid"
      >
        <!-- Sender + status -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
              {{ bid.senderInitials }}
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-text truncate">{{ bid.senderName }}</p>
              <p class="text-xs text-text-muted"><span class="font-mono tabular-nums">{{ bid.senderTotalShipments }}</span> envois</p>
            </div>
          </div>
          <Badge :variant="STATUS_VARIANT[bid.status] ?? 'neutral'" size="sm" class="flex-shrink-0">
            {{ STATUS_LABELS[bid.status] ?? bid.status }}
          </Badge>
        </div>

        <!-- Details grid -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-surface-el rounded-el px-2 py-2">
            <p class="font-mono text-sm font-semibold tabular-nums text-text">{{ bid.weightKg }} kg</p>
            <p class="text-xs text-text-subtle">Poids</p>
          </div>
          <div class="bg-surface-el rounded-el px-2 py-2">
            <p class="font-mono text-sm font-semibold tabular-nums text-text">{{ bid.declaredValueEuros }} €</p>
            <p class="text-xs text-text-subtle">Valeur</p>
          </div>
          <div class="bg-surface-el rounded-el px-2 py-2">
            <p class="font-mono text-sm font-semibold tabular-nums text-primary">{{ bid.earningsEuros.toFixed(2) }} €</p>
            <p class="text-xs text-text-subtle">Revenus nets</p>
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
            class="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-btn bg-success text-on-primary text-xs font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
            :data-test="`accept-card-${bid.id}`"
            @click.stop="emit('accept', bid.id)"
          >
            <CheckCircle class="w-3.5 h-3.5" />
            Accepter
          </button>
          <button
            :disabled="props.loadingBidId === bid.id"
            class="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-btn border border-danger text-danger text-xs font-medium hover:bg-danger/10 transition-colors disabled:opacity-50"
            :data-test="`reject-card-${bid.id}`"
            @click.stop="emit('reject', bid.id)"
          >
            <XCircle class="w-3.5 h-3.5" />
            Refuser
          </button>
        </div>

        <!-- Action ACCEPTED : confirmer la prise en charge (DEPART) -->
        <div v-else-if="bid.status === 'ACCEPTED'" class="flex items-center gap-2 pt-1">
          <button
            :disabled="props.loadingBidId === bid.id"
            class="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-btn bg-primary text-white text-xs font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
            :data-test="`handover-card-${bid.id}`"
            @click="emit('tracking-event', bid.id, 'DEPART')"
          >
            <PackageCheck class="w-3.5 h-3.5" />
            Confirmer la prise en charge
          </button>
          <button
            :disabled="props.loadingBidId === bid.id"
            class="flex items-center justify-center h-9 w-9 rounded-btn border border-primary/50 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            :data-test="`scan-card-${bid.id}`"
            aria-label="Scanner le QR du colis"
            title="Scanner le QR du colis"
            @click="openScan(bid)"
          >
            <QrCode class="w-4 h-4" />
          </button>
        </div>

        <!-- Action HANDED_OVER : marquer en transit (TRANSIT) -->
        <div v-else-if="bid.status === 'HANDED_OVER'" class="pt-1">
          <button
            :disabled="props.loadingBidId === bid.id"
            class="w-full flex items-center justify-center gap-1.5 h-9 rounded-btn border border-primary/50 text-primary text-xs font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
            :data-test="`transit-card-${bid.id}`"
            @click="emit('tracking-event', bid.id, 'TRANSIT')"
          >
            <PackageCheck class="w-3.5 h-3.5" />
            Marquer en transit
          </button>
        </div>

        <!-- Action IN_TRANSIT : confirmer la livraison -->
        <div v-else-if="bid.status === 'IN_TRANSIT'" class="pt-1">
          <button
            :disabled="props.loadingBidId === bid.id"
            class="w-full flex items-center justify-center gap-1.5 h-9 rounded-btn border border-primary/50 text-primary text-xs font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
            :data-test="`confirm-delivery-card-${bid.id}`"
            @click.stop="openConfirmModal(bid)"
          >
            <PackageCheck class="w-3.5 h-3.5" />
            Confirmer la livraison
          </button>
        </div>
      </div>
    </div>

    <!-- Footer count -->
    <p v-if="!isLoading && filteredBids.length > 0" class="text-xs text-text-muted text-right">
      <span class="font-mono tabular-nums">{{ filteredBids.length }}</span> colis affichés · <span class="font-mono tabular-nums">{{ props.bids.length }}</span> au total
    </p>
  </div>

  <!-- Panneau détail d'un colis + actions -->
  <TripBidDetailPanel
    :bid="detailBid"
    :loading-bid-id="loadingBidId"
    @close="detailBid = null"
    @accept="(id) => forwardAndClose(() => emit('accept', id))"
    @reject="(id) => forwardAndClose(() => emit('reject', id))"
    @confirm-presence="(id) => forwardAndClose(() => emit('confirm-presence', id))"
    @refuse-parcel="(id, reason, photo) => forwardAndClose(() => emit('refuse-parcel', id, reason, photo))"
    @cancel="(id) => forwardAndClose(() => emit('cancel', id))"
    @request-delivery="onPanelRequestDelivery"
  />

  <!-- Modale confirmation de livraison -->
  <Teleport to="body">
    <div
      v-if="confirmingBid"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="closeConfirmModal"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div class="relative w-full max-w-sm rounded-card border border-border bg-surface shadow-pop p-6 space-y-5">

        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-el bg-primary/10 flex items-center justify-center flex-shrink-0">
              <PackageCheck class="w-5 h-5 text-primary" />
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
            class="w-full h-12 px-4 rounded-input bg-surface-el border border-border-strong text-text text-center text-lg font-mono tabular-nums tracking-[0.4em] placeholder:text-text-subtle/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-[border-color,box-shadow]"
            @keyup.enter="submitConfirmDelivery"
          />
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2.5 pt-1">
          <button
            class="flex-1 h-10 rounded-btn border border-border-strong text-sm text-text hover:bg-surface-el transition-colors"
            @click="closeConfirmModal"
          >
            Annuler
          </button>
          <button
            :disabled="confirmCode.length !== 6 || props.loadingBidId === confirmingBid.id"
            class="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-btn bg-primary text-on-primary text-sm font-medium shadow-btn hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-test="confirm-delivery-submit"
            @click="submitConfirmDelivery"
          >
            <span v-if="props.loadingBidId === confirmingBid.id" class="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            <CheckCircle v-else class="w-4 h-4" />
            Confirmer
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modale scan QR (prise en charge) -->
  <Teleport to="body">
    <div
      v-if="scanningBid"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-test="scan-modal"
      @click.self="closeScan"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div class="relative w-full max-w-sm bg-surface border border-border rounded-card shadow-2xl p-6 space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="font-semibold text-text text-sm">Scanner le QR du colis</h3>
            <p class="text-xs text-text-muted mt-0.5">Colis de {{ scanningBid.senderName }}</p>
          </div>
          <button class="text-text-muted hover:text-text transition-colors p-1" data-test="scan-close" @click="closeScan">
            <X class="w-4 h-4" />
          </button>
        </div>
        <QrScanner @detected="onScanDetected" />
        <button
          class="w-full h-10 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
          @click="closeScan"
        >
          Annuler
        </button>
      </div>
    </div>
  </Teleport>
</template>
