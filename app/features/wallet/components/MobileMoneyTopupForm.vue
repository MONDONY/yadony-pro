<!-- app/features/wallet/components/MobileMoneyTopupForm.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Smartphone, Loader2, CheckCircle2, XCircle } from 'lucide-vue-next'
import { amountStep, currencySymbol, formatMoney, isZeroDecimal } from '@/lib/money'
import { useMobileMoneyTopup } from '@/features/wallet/composables/useMobileMoneyTopup'

const emit = defineEmits<{ confirmed: [] }>()

const {
  step, phone, providers, provider, started, state, currency, isBusy, error, timedOut,
  lookupProviders, pay, reset,
} = useMobileMoneyTopup(() => emit('confirmed'))

const amount = ref('')

const minAmount = computed(() => (isZeroDecimal(currency.value) ? 500 : 1))
const canPay = computed(() => {
  const n = Number(amount.value)
  return !!provider.value && Number.isFinite(n) && n >= minAmount.value && !isBusy.value
})

function submitPay() {
  if (canPay.value) pay(Number(amount.value))
}

function restart() {
  amount.value = ''
  reset()
}

const inputClass =
  'h-9 rounded-input bg-surface-el border border-border-strong px-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors'
</script>

<template>
  <div class="space-y-3" data-test="topup-mm">
    <!-- 1. Numéro -->
    <form v-if="step === 'phone'" class="space-y-2" data-test="mm-phone-step" @submit.prevent="lookupProviders">
      <label class="block text-xs font-medium text-text-muted" for="mm-phone">Numéro mobile money à débiter</label>
      <div class="flex flex-wrap items-center gap-2">
        <input
          id="mm-phone"
          v-model="phone"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="+221 77 123 45 67"
          data-test="mm-phone"
          :class="[inputClass, 'w-56']"
        />
        <button
          type="submit"
          :disabled="isBusy || !phone.trim()"
          data-test="mm-continue"
          class="inline-flex h-9 items-center gap-1.5 px-4 rounded-btn bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Smartphone class="h-3.5 w-3.5" aria-hidden="true" />
          {{ isBusy ? 'Vérification…' : 'Recharger par mobile money' }}
        </button>
      </div>
    </form>

    <!-- 2. Réseau et montant -->
    <form v-else-if="step === 'details' && providers" class="space-y-3" data-test="mm-details-step" @submit.prevent="submitPay">
      <p class="text-xs text-text-muted">
        Numéro <span class="font-mono tabular-nums text-text">{{ providers.msisdnMasked }}</span>
        · devise créditée : <span class="font-medium text-text" data-test="mm-currency">{{ providers.currency }}</span>
      </p>
      <fieldset class="space-y-1.5">
        <legend class="text-xs font-medium text-text-muted">Réseau</legend>
        <label
          v-for="p in providers.providers"
          :key="p.code"
          class="flex items-center gap-2 text-sm text-text cursor-pointer"
        >
          <input v-model="provider" type="radio" name="mm-provider" :value="p.code" :data-test="`mm-provider-${p.code}`" />
          {{ p.label }}
          <span v-if="p.detected" class="text-2xs text-text-subtle">(détecté)</span>
        </label>
      </fieldset>
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative">
          <input
            v-model="amount"
            type="number"
            :min="minAmount"
            :step="amountStep(currency)"
            :placeholder="`Montant (${currencySymbol(currency)})`"
            data-test="mm-amount"
            :class="[inputClass, 'w-40 pr-12']"
          />
          <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-subtle">{{ currencySymbol(currency) }}</span>
        </div>
        <button
          type="submit"
          :disabled="!canPay"
          data-test="mm-pay"
          class="inline-flex h-9 items-center px-4 rounded-btn bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isBusy ? 'Envoi…' : 'Payer' }}
        </button>
        <button type="button" class="text-xs text-text-muted underline hover:text-text" data-test="mm-back" @click="restart">Changer de numéro</button>
      </div>
      <p class="text-2xs text-text-subtle">Minimum {{ formatMoney(minAmount, currency) }}.</p>
    </form>

    <!-- 3. Attente du code PIN -->
    <div v-else-if="step === 'waiting' && started" class="space-y-2 rounded-el border border-border bg-surface-el px-3 py-3 text-sm" data-test="mm-waiting">
      <p class="flex items-center gap-2 text-text">
        <Loader2 v-if="!timedOut" class="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
        <span v-if="!timedOut">
          Valide le paiement {{ started.providerLabel }} sur ton téléphone
          (<span class="font-mono tabular-nums">{{ started.msisdnMasked }}</span>).
        </span>
        <span v-else data-test="mm-timeout">
          Toujours en attente. Si tu as validé le paiement, ton solde se mettra à jour tout seul.
        </span>
      </p>
      <a
        v-if="started.authorizationUrl"
        :href="started.authorizationUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-block text-xs font-medium text-primary underline"
        data-test="mm-authorize"
      >Ouvrir la page de validation</a>
    </div>

    <!-- 4. Résultat -->
    <div v-else-if="step === 'done' && state" class="space-y-2 text-sm" data-test="mm-done">
      <p v-if="state.status === 'CONFIRMED'" class="flex items-center gap-2 text-success" data-test="mm-confirmed">
        <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
        Recharge de {{ formatMoney(state.amount, state.currency) }} créditée.
      </p>
      <p v-else class="flex items-center gap-2 text-danger" data-test="mm-failed">
        <XCircle class="h-4 w-4" aria-hidden="true" />
        {{ state.failureReason || 'La recharge a échoué, rien n’a été débité.' }}
      </p>
      <button type="button" class="text-xs text-text-muted underline hover:text-text" data-test="mm-again" @click="restart">
        Faire une autre recharge
      </button>
    </div>

    <p v-if="error" class="text-xs text-danger" data-test="mm-error">{{ error }}</p>
  </div>
</template>
