<!-- app/features/wallet/components/WalletCard.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { Wallet, Smartphone } from 'lucide-vue-next'
import { useWallet } from '@/features/wallet/composables/useWallet'
import { formatMoney } from '@/lib/money'

const { balance, currency, transactions, isLoading, error, fetchBalance } = useWallet()

const TX_LABELS: Record<string, string> = {
  TOPUP: 'Recharge',
  COMMISSION: 'Commission',
  PAYOUT: 'Virement',
  REFUND: 'Remboursement',
}

/** Montant signé d'une ligne, dans sa devise (celle du portefeuille en repli). */
function formatTransaction(amount: number, txCurrency?: string): string {
  const value = Number(amount)
  const formatted = formatMoney(Math.abs(value), txCurrency ?? currency.value)
  return value >= 0 ? `+${formatted}` : `−${formatted}`
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
      <p class="font-display text-3xl font-bold text-text font-mono tabular-nums" data-test="wallet-balance">
        {{ balance !== null ? formatMoney(balance, currency) : '—' }}
      </p>

      <!-- Recharge : le portail ne sait pas encaisser une carte (pas de Stripe.js) et
           le backend a retiré Wave et Orange Money ; le bouton menait à une erreur. -->
      <div class="flex items-start gap-2 rounded-el border border-border bg-surface-el px-3 py-2.5 text-xs text-text-muted" data-test="topup-mobile-hint">
        <Smartphone class="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-subtle" aria-hidden="true" />
        <span>Pour recharger ton portefeuille par carte bancaire, passe par l'app mobile Yadony (Portefeuille, puis Recharger).</span>
      </div>

      <!-- Transactions -->
      <div v-if="transactions.length > 0">
        <p class="text-2xs font-semibold uppercase tracking-[0.12em] text-text-subtle mb-1">Dernières opérations</p>
        <ul class="divide-y divide-border">
          <li v-for="(tx, i) in transactions" :key="i" class="flex items-center gap-3 py-2 text-sm">
            <span class="text-text">{{ TX_LABELS[tx.type] ?? tx.type }}</span>
            <span class="text-xs text-text-subtle">{{ formatDate(tx.createdAt) }}</span>
            <span class="ml-auto font-mono tabular-nums" :class="tx.amount >= 0 ? 'text-success' : 'text-danger'" :data-test="`wallet-tx-${i}`">
              {{ formatTransaction(tx.amount, tx.currency) }}
            </span>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>
