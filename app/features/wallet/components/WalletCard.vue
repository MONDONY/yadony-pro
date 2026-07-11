<!-- app/features/wallet/components/WalletCard.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Wallet } from 'lucide-vue-next'
import { useWallet } from '@/features/wallet/composables/useWallet'
import type { TopupMethod } from '@/features/wallet/types/index'

const { balance, currency, transactions, isLoading, isToppingUp, error, fetchBalance, startTopup } = useWallet()

const amount = ref<string>('')
const method = ref<TopupMethod>('WAVE')

const TX_LABELS: Record<string, string> = {
  TOPUP: 'Recharge',
  COMMISSION: 'Commission',
  PAYOUT: 'Virement',
  REFUND: 'Remboursement',
}

const canTopup = computed(() => {
  const n = Number(amount.value)
  return Number.isFinite(n) && n >= 1 && !isToppingUp.value
})

async function submitTopup() {
  if (!canTopup.value) return
  const url = await startTopup(Number(amount.value), method.value)
  if (url) window.location.assign(url)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => {
  fetchBalance()
})
</script>

<template>
  <section class="bg-surface border border-border rounded-card p-5 space-y-4" data-test="wallet-card">
    <header class="flex items-center justify-between">
      <div>
        <h2 class="font-display font-semibold text-base text-text">Portefeuille</h2>
        <p class="text-sm text-text-muted">Solde utilisé pour tes commissions et remboursements.</p>
      </div>
      <Wallet class="w-5 h-5 text-text-subtle" />
    </header>

    <p v-if="error" class="text-sm text-danger" data-test="wallet-error">{{ error }}</p>

    <div v-else-if="isLoading" class="h-16 bg-border rounded animate-pulse" data-test="wallet-loading" />

    <template v-else>
      <p class="font-display text-3xl font-bold text-text font-mono tabular-nums">
        {{ balance !== null ? balance.toFixed(2) : '—' }}
        <span class="text-lg text-text-muted">{{ currency === 'EUR' ? '€' : currency }}</span>
      </p>

      <!-- Recharge -->
      <div class="flex flex-wrap items-center gap-2">
        <input
          v-model="amount"
          type="number"
          min="1"
          placeholder="Montant (€)"
          data-test="topup-amount"
          class="h-9 w-32 px-3 rounded-input bg-surface-el border border-border-strong text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors"
        />
        <select
          v-model="method"
          data-test="topup-method"
          class="h-9 px-2 rounded-input bg-surface-el border border-border-strong text-sm text-text focus:outline-none focus:border-primary transition-colors"
        >
          <option value="WAVE">Wave</option>
          <option value="ORANGE_MONEY">Orange Money</option>
          <option value="STRIPE" disabled>Carte bancaire (app mobile)</option>
        </select>
        <button
          :disabled="!canTopup"
          data-test="topup-submit"
          class="h-9 px-4 rounded-btn bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="submitTopup"
        >
          {{ isToppingUp ? 'Redirection…' : 'Recharger' }}
        </button>
      </div>

      <!-- Transactions -->
      <div v-if="transactions.length > 0">
        <p class="text-2xs font-semibold uppercase tracking-[0.12em] text-text-subtle mb-1">Dernières opérations</p>
        <ul class="divide-y divide-border">
          <li v-for="(tx, i) in transactions" :key="i" class="flex items-center gap-3 py-2 text-sm">
            <span class="text-text">{{ TX_LABELS[tx.type] ?? tx.type }}</span>
            <span class="text-xs text-text-subtle">{{ formatDate(tx.createdAt) }}</span>
            <span class="ml-auto font-mono tabular-nums" :class="tx.amount >= 0 ? 'text-success' : 'text-danger'">
              {{ tx.amount >= 0 ? '+' : '' }}{{ Number(tx.amount).toFixed(2) }} €
            </span>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>
