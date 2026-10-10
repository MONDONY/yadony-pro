<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CountrySelector from './CountrySelector.vue'
import { type Country, COUNTRIES, DEFAULT_COUNTRY } from '../data/countries'
import { countryForInternational, internationalForm, isValidE164, toE164 } from '../lib/phone'
import { useFirebaseAuth } from '@/features/auth/composables/useFirebaseAuth'

const QUICK_COUNTRIES = COUNTRIES.slice(0, 4) // FR, SN, CI, ML

const emit = defineEmits<{ sent: [phone: string] }>()

const country = ref<Country>(DEFAULT_COUNTRY)
const localNumber = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const fullPhone = computed(() => toE164(country.value, localNumber.value))

// Numéro collé au format international (« +1 713… », « 0033 6… ») : le
// sélecteur suit l'indicatif saisi au lieu de le préfixer une seconde fois.
watch(localNumber, (raw) => {
  const international = internationalForm(raw)
  if (!international) return
  const detected = countryForInternational(international, country.value)
  if (detected && detected.code !== country.value.code) country.value = detected
})

const { sendOtp } = useFirebaseAuth()

async function submit() {
  if (loading.value) return
  error.value = null
  if (!isValidE164(fullPhone.value)) {
    error.value = `Numéro invalide (ex : ${country.value.hint})`
    return
  }
  loading.value = true
  try {
    await sendOtp(fullPhone.value, 'recaptcha-container')
    emit('sent', fullPhone.value)
  }
  catch (e) {
    error.value = (e as Error).message || 'Erreur envoi OTP'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <div>
      <label class="block text-xs font-semibold text-muted mb-2">Numéro de téléphone</label>
      <div class="flex gap-2">
        <CountrySelector v-model="country" />
        <input
          v-model="localNumber"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          :placeholder="country.hint"
          :disabled="loading"
          class="flex-1 h-11 rounded-[10px] border bg-surface-el px-4 text-sm text-text placeholder:text-subtle outline-none focus:border-primary transition-colors"
          :class="error ? 'border-danger' : 'border-border'"
        />
      </div>
      <div class="flex gap-2 flex-wrap mt-2">
        <button
          v-for="c in QUICK_COUNTRIES"
          :key="c.code"
          type="button"
          data-test="country-chip"
          class="flex items-center gap-1.5 h-7 px-2.5 rounded-[7px] border text-xs font-medium transition-colors"
          :class="c.code === country.code
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border text-subtle hover:border-primary/30 hover:text-text'"
          @click="country = c"
        >
          {{ c.flag }} {{ c.name }}
        </button>
      </div>
    </div>

    <p v-if="error" class="text-xs text-danger" aria-live="polite">{{ error }}</p>

    <button
      type="submit"
      :disabled="loading"
      class="h-11 rounded-btn bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-50"
    >
      {{ loading ? 'Envoi en cours...' : 'Recevoir le code par SMS →' }}
    </button>

    <div id="recaptcha-container" />
  </form>
</template>
