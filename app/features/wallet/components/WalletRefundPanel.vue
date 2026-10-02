<!-- app/features/wallet/components/WalletRefundPanel.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatMoney } from '@/lib/money'
import { useWalletRefund } from '@/features/wallet/composables/useWalletRefund'
import type { WalletCurrencyBalance } from '@/features/wallet/types/index'

const props = defineProps<{ balances: WalletCurrencyBalance[] }>()
const emit = defineEmits<{ requested: [] }>()

const { eligible, selected, requests, isLoading, isRequesting, error, loadEligible, loadRequests, toggle, request } =
  useWalletRefund(() => emit('requested'))

const open = ref<string | null>(null)

const refundable = computed(() => props.balances.filter((b) => b.refundEligible))

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  COMPLETED: 'Remboursé',
  PARTIALLY_COMPLETED: 'Partiellement remboursé',
  FAILED: 'Échoué',
  REJECTED: 'Refusé',
}
const RAIL_LABELS: Record<string, string> = { STRIPE: 'Carte', PAWAPAY: 'Mobile money', MANUAL: 'Traitement manuel' }

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

async function openFor(currency: string) {
  open.value = currency
  await loadEligible(currency)
}

async function submit(currency: string) {
  const created = await request(currency)
  if (created) open.value = null
}

onMounted(loadRequests)
</script>

<template>
  <div v-if="refundable.length > 0 || requests.length > 0" class="space-y-3 border-t border-border pt-4" data-test="wallet-refund">
    <p class="text-2xs font-semibold uppercase tracking-[0.12em] text-text-subtle">Remboursement du solde</p>

    <div v-for="b in refundable" :key="b.currency" class="space-y-2" :data-test="`refund-${b.currency}`">
      <div class="flex flex-wrap items-center gap-3 text-sm">
        <span class="text-text">
          {{ formatMoney(b.refundableAmount, b.currency) }} remboursable
          <span v-if="b.refundFeeAmount > 0" class="text-xs text-text-muted">
            (frais {{ formatMoney(b.refundFeeAmount, b.currency) }}, net {{ formatMoney(b.refundNetAmount, b.currency) }})
          </span>
        </span>
        <button
          v-if="open !== b.currency"
          type="button"
          :data-test="`refund-open-${b.currency}`"
          class="h-8 px-3 rounded-btn border border-border-strong text-xs text-text hover:bg-surface-el transition-colors"
          @click="openFor(b.currency)"
        >
          Demander le remboursement
        </button>
      </div>

      <div v-if="open === b.currency" class="space-y-2 rounded-el border border-border bg-surface-el p-3">
        <p v-if="isLoading" class="text-xs text-text-muted">Chargement…</p>
        <p v-else-if="eligible.length === 0" class="text-xs text-text-muted" data-test="refund-none">Aucune recharge remboursable.</p>
        <ul v-else class="space-y-1.5">
          <li v-for="t in eligible" :key="t.id" class="flex items-center gap-2 text-sm">
            <input
              :id="`refund-${t.id}`"
              type="checkbox"
              :checked="selected.includes(t.id)"
              :data-test="`refund-select-${t.id}`"
              @change="toggle(t.id)"
            />
            <label :for="`refund-${t.id}`" class="flex-1 text-text">
              Recharge du {{ formatDate(t.createdAt) }}
            </label>
            <span class="font-mono tabular-nums text-text">{{ formatMoney(t.amount, b.currency) }}</span>
          </li>
        </ul>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="isRequesting || selected.length === 0"
            data-test="refund-submit"
            class="h-8 px-3 rounded-btn bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
            @click="submit(b.currency)"
          >
            {{ isRequesting ? 'Envoi…' : 'Confirmer' }}
          </button>
          <button type="button" class="h-8 px-3 text-xs text-text-muted hover:text-text" data-test="refund-cancel" @click="open = null">Annuler</button>
        </div>
        <p v-if="error" class="text-xs text-danger" data-test="refund-error">{{ error }}</p>
      </div>
    </div>

    <ul v-if="requests.length > 0" class="divide-y divide-border" data-test="refund-requests">
      <li v-for="r in requests" :key="r.id" class="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2 text-sm">
        <span class="text-text">{{ formatDate(r.requestedAt) }}</span>
        <span class="text-xs text-text-muted">
          {{ STATUS_LABELS[r.status] ?? r.status }} · {{ RAIL_LABELS[r.rail] ?? r.rail }}<template v-if="r.destinationMasked"> · {{ r.destinationMasked }}</template>
        </span>
        <span class="ml-auto font-mono tabular-nums text-text">{{ formatMoney(r.netAmount ?? r.amount, r.currency) }}</span>
      </li>
    </ul>
  </div>
</template>
