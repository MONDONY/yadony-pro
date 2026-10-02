<!-- app/features/wallet/components/WalletCard.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Wallet, Smartphone, CreditCard } from 'lucide-vue-next'
import { useWallet } from '@/features/wallet/composables/useWallet'
import { amountStep, currencySymbol, formatMoney, isMobileMoneyCurrency, isZeroDecimal } from '@/lib/money'
import MobileMoneyTopupForm from '@/features/wallet/components/MobileMoneyTopupForm.vue'
import WalletRefundPanel from '@/features/wallet/components/WalletRefundPanel.vue'

const { balance, currency, transactions, balances, estimatedTotal, estimateComplete, isLoading, isToppingUp, error, fetchBalance, startCardTopup } = useWallet()
const route = useRoute()
const router = useRouter()

const amount = ref<string>('')
/** Vrai quand le serveur ne propose pas encore la recharge web : renvoi vers l'app mobile. */
const cardUnavailable = ref(false)
const topupError = ref<string | null>(null)
/** Message du retour de Stripe Checkout (?topup=success|canceled), lu une seule fois. */
const returnNotice = ref<'success' | 'canceled' | null>(null)

/** Autres portefeuilles du voyageur (une devise chacun) à lister sous le solde actif. */
const walletList = computed(() => balances?.value ?? [])
const showBalances = computed(() => walletList.value.length > 1)
/** Les devises sans carte (franc CFA) se rechargent par mobile money. */
const useMobileMoney = computed(() => isMobileMoneyCurrency(currency.value))

const minAmount = computed(() => (isZeroDecimal(currency.value) ? 500 : 1))

const canTopup = computed(() => {
  const n = Number(amount.value)
  return Number.isFinite(n) && n >= minAmount.value && !isToppingUp.value
})

async function submitCardTopup() {
  if (!canTopup.value) return
  topupError.value = null
  const outcome = await startCardTopup(Number(amount.value))
  if (outcome.status === 'redirect') {
    window.location.assign(outcome.url)
  } else if (outcome.status === 'unavailable') {
    cardUnavailable.value = true
  } else {
    topupError.value = outcome.message
  }
}

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
  const topup = route.query.topup
  if (topup === 'success' || topup === 'canceled') {
    returnNotice.value = topup
    // Le paramètre ne doit pas survivre à un rechargement : on l'efface de l'URL.
    router.replace({ query: { ...route.query, topup: undefined } }).catch(() => {})
  }
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

      <!-- Un portefeuille par devise, avec un total estimé quand il y en a plusieurs -->
      <div v-if="showBalances" class="space-y-1" data-test="wallet-balances">
        <ul class="divide-y divide-border">
          <li v-for="b in walletList" :key="b.currency" class="flex items-center gap-2 py-1.5 text-sm" :data-test="`wallet-balance-${b.currency}`">
            <span class="text-text">{{ b.currency }}</span>
            <span v-if="b.active" class="text-2xs text-text-subtle">actif</span>
            <span class="ml-auto font-mono tabular-nums text-text">{{ formatMoney(b.balance, b.currency) }}</span>
          </li>
        </ul>
        <p v-if="estimatedTotal !== null && estimatedTotal !== undefined" class="text-xs text-text-muted" data-test="wallet-estimated-total">
          Total estimé {{ formatMoney(estimatedTotal, currency) }}<template v-if="estimateComplete === false"> (partiel : une devise n'a pas pu être convertie)</template>
        </p>
      </div>

      <p v-if="returnNotice === 'success'" class="rounded-el border border-success/30 bg-success/10 px-3 py-2 text-xs text-success" data-test="topup-return-success">
        Paiement validé. Ton solde se met à jour dans quelques instants.
      </p>
      <p v-else-if="returnNotice === 'canceled'" class="rounded-el border border-border bg-surface-el px-3 py-2 text-xs text-text-muted" data-test="topup-return-canceled">
        Recharge annulée, rien n'a été débité.
      </p>

      <!-- Recharge par carte : session Stripe Checkout hébergée, ouverte par le serveur.
           Les anciens rails Wave et Orange Money ont été retirés par le backend. -->
      <MobileMoneyTopupForm v-if="useMobileMoney" @confirmed="fetchBalance" />
      <div v-else-if="!cardUnavailable" class="space-y-2" data-test="topup-card-form">
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative">
            <input
              v-model="amount"
              type="number"
              :min="minAmount"
              :step="amountStep(currency)"
              :placeholder="`Montant (${currencySymbol(currency)})`"
              data-test="topup-amount"
              class="h-9 w-40 pl-3 pr-12 rounded-input bg-surface-el border border-border-strong text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors"
            />
            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-subtle" data-test="topup-currency">{{ currencySymbol(currency) }}</span>
          </div>
          <button
            :disabled="!canTopup"
            data-test="topup-submit"
            class="inline-flex h-9 items-center gap-1.5 px-4 rounded-btn bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="submitCardTopup"
          >
            <CreditCard class="h-3.5 w-3.5" aria-hidden="true" />
            {{ isToppingUp ? 'Redirection…' : 'Recharger par carte' }}
          </button>
        </div>
        <p class="text-2xs text-text-subtle">Paiement sécurisé par Stripe, minimum {{ formatMoney(minAmount, currency) }}.</p>
        <p v-if="topupError" class="text-xs text-danger" data-test="topup-error">{{ topupError }}</p>
      </div>
      <div v-else class="flex items-start gap-2 rounded-el border border-border bg-surface-el px-3 py-2.5 text-xs text-text-muted" data-test="topup-mobile-hint">
        <Smartphone class="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-subtle" aria-hidden="true" />
        <span>La recharge par carte depuis le web n'est pas encore disponible sur ce serveur : passe par l'app mobile Yadony (Portefeuille, puis Recharger).</span>
      </div>

      <WalletRefundPanel :balances="walletList" @requested="fetchBalance" />

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
