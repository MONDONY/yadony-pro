<!-- app/features/trajets/components/TripBidDetailPanel.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, CheckCircle, XCircle, UserCheck, Ban, PackageCheck } from 'lucide-vue-next'
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import type { TripBid } from '@/features/trajets/types/index'

const props = defineProps<{
  bid: TripBid | null
  loadingBidId?: string | null
}>()

const emit = defineEmits<{
  close: []
  accept: [bidId: string]
  reject: [bidId: string]
  'confirm-presence': [bidId: string]
  'refuse-parcel': [bidId: string, reason: string]
  cancel: [bidId: string]
  'request-delivery': [bid: TripBid]
}>()

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

// Sous-formulaires (raison de refus, confirmation d'annulation)
const refuseMode = ref(false)
const refuseReason = ref('')
const cancelMode = ref(false)

// Réinitialise les sous-formulaires quand on change de colis / ferme.
watch(() => props.bid?.id, () => {
  refuseMode.value = false
  refuseReason.value = ''
  cancelMode.value = false
})

const isBusy = computed(() => !!props.bid && props.loadingBidId === props.bid.id)

function submitRefuse() {
  if (!props.bid || refuseReason.value.trim().length < 3) return
  emit('refuse-parcel', props.bid.id, refuseReason.value.trim())
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="bid"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-test="trip-bid-detail"
      @click.self="emit('close')"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div class="relative w-full max-w-md rounded-card border border-border bg-surface shadow-pop">

        <!-- Header -->
        <div class="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
              {{ bid.senderInitials }}
            </div>
            <div class="min-w-0">
              <p class="font-display font-semibold text-text truncate">{{ bid.senderName }}</p>
              <p class="text-xs text-text-muted"><span class="font-mono tabular-nums">{{ bid.senderTotalShipments }}</span> envois</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <Badge :variant="STATUS_VARIANT[bid.status] ?? 'neutral'" size="sm">{{ STATUS_LABELS[bid.status] ?? bid.status }}</Badge>
            <button
              class="rounded-btn p-1 text-text-muted hover:bg-surface-el hover:text-text transition-colors"
              aria-label="Fermer"
              data-test="detail-close"
              @click="emit('close')"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-4">
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-surface-el rounded-el px-2 py-2.5">
              <p class="font-mono text-sm font-semibold tabular-nums text-text">{{ bid.weightKg }} kg</p>
              <p class="text-2xs text-text-subtle">Poids</p>
            </div>
            <div class="bg-surface-el rounded-el px-2 py-2.5">
              <p class="font-mono text-sm font-semibold tabular-nums text-text">{{ bid.declaredValueEuros }} €</p>
              <p class="text-2xs text-text-subtle">Valeur</p>
            </div>
            <div class="bg-surface-el rounded-el px-2 py-2.5">
              <p class="font-mono text-sm font-semibold tabular-nums text-primary">{{ bid.earningsEuros.toFixed(2) }} €</p>
              <p class="text-2xs text-text-subtle">Revenus nets</p>
            </div>
          </div>

          <div v-if="bid.contentDescription" class="text-sm text-text-muted">
            <span class="text-text-subtle">Contenu :</span> {{ bid.contentDescription }}
          </div>
          <div v-if="bid.paymentMethod" class="text-xs text-text-muted">
            <span class="text-text-subtle">Paiement :</span> {{ bid.paymentMethod }}
          </div>
        </div>

        <!-- Actions -->
        <div class="border-t border-border px-5 py-4 space-y-3">

          <!-- PAYMENT_ESCROWED : accepter / refuser le bid -->
          <div v-if="bid.status === 'PAYMENT_ESCROWED'" class="flex items-center gap-2">
            <button
              :disabled="isBusy"
              class="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-btn bg-success text-on-primary text-sm font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
              data-test="detail-accept"
              @click="emit('accept', bid.id)"
            >
              <CheckCircle class="w-4 h-4" /> Accepter
            </button>
            <button
              :disabled="isBusy"
              class="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-btn border border-danger text-danger text-sm font-medium hover:bg-danger/10 transition-colors disabled:opacity-50"
              data-test="detail-reject"
              @click="emit('reject', bid.id)"
            >
              <XCircle class="w-4 h-4" /> Refuser
            </button>
          </div>

          <!-- ACCEPTED : confirmer présence, refuser le colis, annuler -->
          <template v-else-if="bid.status === 'ACCEPTED'">
            <button
              :disabled="isBusy"
              class="w-full flex items-center justify-center gap-1.5 h-10 rounded-btn bg-primary text-on-primary text-sm font-medium shadow-btn hover:bg-primary-hover transition-colors disabled:opacity-50"
              data-test="detail-confirm-presence"
              @click="emit('confirm-presence', bid.id)"
            >
              <UserCheck class="w-4 h-4" /> Confirmer ma présence
            </button>
            <div class="flex items-center gap-2">
              <button
                :disabled="isBusy"
                class="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-btn border border-danger/60 text-danger text-xs font-medium hover:bg-danger/10 transition-colors disabled:opacity-50"
                data-test="detail-refuse-parcel"
                @click="refuseMode = !refuseMode; cancelMode = false"
              >
                <Ban class="w-3.5 h-3.5" /> Refuser le colis
              </button>
              <button
                :disabled="isBusy"
                class="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-btn border border-border-strong text-text-muted text-xs font-medium hover:bg-surface-el hover:text-text transition-colors disabled:opacity-50"
                data-test="detail-cancel"
                @click="cancelMode = !cancelMode; refuseMode = false"
              >
                Annuler le colis
              </button>
            </div>
          </template>

          <!-- HANDED_OVER : refuser le colis (inspection) -->
          <button
            v-else-if="bid.status === 'HANDED_OVER'"
            :disabled="isBusy"
            class="w-full flex items-center justify-center gap-1.5 h-10 rounded-btn border border-danger text-danger text-sm font-medium hover:bg-danger/10 transition-colors disabled:opacity-50"
            data-test="detail-refuse-parcel"
            @click="refuseMode = !refuseMode"
          >
            <Ban class="w-4 h-4" /> Refuser le colis
          </button>

          <!-- IN_TRANSIT : confirmer la livraison (délègue à la modale code) -->
          <button
            v-else-if="bid.status === 'IN_TRANSIT'"
            :disabled="isBusy"
            class="w-full flex items-center justify-center gap-1.5 h-10 rounded-btn border border-primary/50 text-primary text-sm font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
            data-test="detail-request-delivery"
            @click="emit('request-delivery', bid)"
          >
            <PackageCheck class="w-4 h-4" /> Confirmer la livraison
          </button>

          <p v-else class="text-xs text-text-muted text-center">Aucune action disponible pour ce statut.</p>

          <!-- Sous-formulaire : raison de refus -->
          <div v-if="refuseMode" class="space-y-2 pt-1">
            <label class="text-xs font-medium text-text-muted">Motif du refus</label>
            <textarea
              v-model="refuseReason"
              rows="2"
              placeholder="Ex. contenu non conforme à la description…"
              data-test="refuse-reason-input"
              class="w-full px-3 py-2 rounded-input bg-surface-el border border-border-strong text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-danger transition-colors resize-none"
            />
            <button
              :disabled="refuseReason.trim().length < 3 || isBusy"
              class="w-full h-9 rounded-btn bg-danger text-on-danger text-xs font-semibold hover:bg-danger-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-test="refuse-submit"
              @click="submitRefuse"
            >
              Confirmer le refus
            </button>
          </div>

          <!-- Sous-formulaire : confirmation d'annulation -->
          <div v-if="cancelMode" class="space-y-2 pt-1">
            <p class="text-xs text-text-muted">Annuler ce colis rembourse l'expéditeur. Confirmer ?</p>
            <button
              :disabled="isBusy"
              class="w-full h-9 rounded-btn bg-danger text-on-danger text-xs font-semibold hover:bg-danger-hover transition-colors disabled:opacity-50"
              data-test="cancel-submit"
              @click="emit('cancel', bid.id)"
            >
              Oui, annuler le colis
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
