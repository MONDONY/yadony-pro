<!-- app/features/payout/components/MobileMoneyPayoutCard.vue -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Smartphone } from 'lucide-vue-next'
import { useMobileMoneyPayout } from '@/features/payout/composables/useMobileMoneyPayout'

const {
  account, catalogue, phone, selected, isLoading, isWorking, error, unavailable,
  fetchAccount, lookup, toggle, activate, saveProviders, disable,
} = useMobileMoneyPayout()

onMounted(fetchAccount)

const isActive = computed(() => account.value?.status === 'ACTIVE')
const providersChanged = computed(() => {
  const current = (account.value?.providers ?? []).map((p) => p.code).sort().join(',')
  return current !== [...selected.value].sort().join(',')
})

const inputClass =
  'h-9 rounded-input bg-surface-el border border-border-strong px-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors'
const primaryBtn =
  'inline-flex h-9 items-center px-4 rounded-btn bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
</script>

<template>
  <section v-if="!unavailable" class="bg-surface border border-border rounded-card p-5 space-y-4" data-test="mm-payout-card">
    <header class="flex items-start gap-3">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-el text-text-muted">
        <Smartphone class="w-5 h-5" aria-hidden="true" />
      </span>
      <div class="min-w-0">
        <h2 class="font-display font-semibold text-base text-text">Versement par mobile money</h2>
        <p class="text-sm text-text-muted">Reçois tes gains sur ton numéro Wave, Orange Money, MTN… sans compte bancaire.</p>
      </div>
    </header>

    <div v-if="isLoading" class="h-12 bg-border rounded animate-pulse" data-test="mm-payout-loading" />

    <!-- Compte actif -->
    <div v-else-if="isActive && account" class="space-y-3" data-test="mm-payout-active">
      <p class="text-sm text-text">
        <span class="font-medium text-success">Activé</span>
        · <span class="font-mono tabular-nums" data-test="mm-payout-number">{{ account.msisdnMasked }}</span>
        <template v-if="account.currency"> · {{ account.currency }}</template>
      </p>
      <p class="text-xs text-text-muted">Réseaux acceptés : {{ account.providers.map((p) => p.label).join(', ') }}</p>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="h-8 px-3 rounded-btn border border-border-strong text-xs text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
          :disabled="isWorking"
          data-test="mm-payout-disable"
          @click="disable"
        >
          Désactiver le versement
        </button>
      </div>
    </div>

    <!-- Activation -->
    <div v-else class="space-y-3" data-test="mm-payout-setup">
      <p v-if="account?.status === 'DISABLED'" class="text-xs text-text-muted">
        Versement désactivé. Ressaisis ton numéro pour le réactiver.
      </p>
      <form class="flex flex-wrap items-center gap-2" @submit.prevent="lookup">
        <input
          v-model="phone"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="+221 77 123 45 67"
          data-test="mm-payout-phone"
          :class="[inputClass, 'w-56']"
        />
        <button type="submit" :disabled="isWorking || !phone.trim()" data-test="mm-payout-lookup" :class="primaryBtn">
          Vérifier le numéro
        </button>
      </form>

      <fieldset v-if="catalogue" class="space-y-1.5" data-test="mm-payout-catalogue">
        <legend class="text-xs font-medium text-text-muted">
          Réseaux sur lesquels tu acceptes d'être payé · {{ catalogue.currency }}
        </legend>
        <label v-for="p in catalogue.providers" :key="p.code" class="flex items-center gap-2 text-sm text-text cursor-pointer">
          <input
            type="checkbox"
            :checked="selected.includes(p.code)"
            :data-test="`mm-payout-provider-${p.code}`"
            @change="toggle(p.code)"
          />
          {{ p.label }}
          <span v-if="p.detected" class="text-2xs text-text-subtle">(détecté)</span>
        </label>
        <button type="button" :disabled="isWorking || selected.length === 0" data-test="mm-payout-activate" :class="primaryBtn" @click="activate">
          {{ isWorking ? 'Activation…' : 'Activer le versement' }}
        </button>
      </fieldset>
    </div>

    <!-- Réseaux modifiables d'un compte actif -->
    <fieldset v-if="isActive && account && account.providers.length > 0" class="space-y-1.5 border-t border-border pt-3" data-test="mm-payout-providers">
      <legend class="text-xs font-medium text-text-muted">Modifier les réseaux acceptés</legend>
      <label v-for="p in account.providers" :key="p.code" class="flex items-center gap-2 text-sm text-text cursor-pointer">
        <input type="checkbox" :checked="selected.includes(p.code)" :data-test="`mm-payout-edit-${p.code}`" @change="toggle(p.code)" />
        {{ p.label }}
      </label>
      <button
        v-if="providersChanged"
        type="button"
        :disabled="isWorking || selected.length === 0"
        data-test="mm-payout-save"
        :class="primaryBtn"
        @click="saveProviders"
      >
        Enregistrer
      </button>
    </fieldset>

    <p v-if="error" class="text-xs text-danger" data-test="mm-payout-error">{{ error }}</p>
  </section>
</template>
