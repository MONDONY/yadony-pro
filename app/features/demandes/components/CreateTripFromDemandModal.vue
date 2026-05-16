<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { tripsService } from '@/features/trajets/services/tripsService'
import { negotiationService } from '@/features/negociations/services/negotiationService'
import type { MatchingRequest } from '@/features/demandes/types/index'

const props = defineProps<{
  request: MatchingRequest | null
}>()

const emit = defineEmits<{
  close: []
  success: [requestId: string]
}>()

const router = useRouter()
const tripsSvc = tripsService()
const negSvc = negotiationService()

// ── Form state ───────────────────────────────────────────────────────────────
const departureDate = ref('')
const transportMode = ref<'PLANE' | 'CAR' | 'TRAIN'>('PLANE')
const availableKg = ref(10)
const proposedPrice = ref(0)
const isLoading = ref(false)
const errorMsg = ref<string | null>(null)

// ── Derived from request ─────────────────────────────────────────────────────
const departureCity = computed(() => props.request?.tripCorridor.split(' → ')[0] ?? '')
const arrivalCity = computed(() => props.request?.tripCorridor.split(' → ')[1] ?? '')

const suggestedPrice = computed(() =>
  props.request ? Math.round(props.request.budgetPerKg * props.request.weightKg) : 0,
)

const canSubmit = computed(() =>
  !!departureDate.value && proposedPrice.value > 0 && !isLoading.value,
)

// ── Reset on new request ─────────────────────────────────────────────────────
watch(
  () => props.request,
  (req) => {
    if (req) {
      proposedPrice.value = Math.round(req.budgetPerKg * req.weightKg)
      departureDate.value = ''
      errorMsg.value = null
    }
  },
  { immediate: true },
)

// ── Price controls ───────────────────────────────────────────────────────────
function decrement() {
  if (proposedPrice.value > 1) proposedPrice.value--
}

function increment() {
  if (proposedPrice.value < suggestedPrice.value) proposedPrice.value++
}

const priceBarWidth = computed(() => {
  if (suggestedPrice.value === 0) return '100%'
  return `${Math.min(100, (proposedPrice.value / suggestedPrice.value) * 100)}%`
})

// ── Transport mode chips ─────────────────────────────────────────────────────
const modes = [
  { value: 'PLANE' as const, label: '✈️ Avion' },
  { value: 'CAR' as const, label: '🚗 Voiture' },
  { value: 'TRAIN' as const, label: '🚄 Train' },
]

// ── Submit ───────────────────────────────────────────────────────────────────
async function submit() {
  if (!props.request || !canSubmit.value) return
  isLoading.value = true
  errorMsg.value = null

  let announcementId: string
  try {
    const trip = await tripsSvc.createAnnouncement({
      departureCity: departureCity.value,
      arrivalCity: arrivalCity.value,
      departureDate: departureDate.value,
      departureTime: null,
      arrivalTime: null,
      transportMode: transportMode.value,
      pickupAddress: { label: departureCity.value, lat: 0, lng: 0 },
      deliveryAddress: { label: arrivalCity.value, lat: 0, lng: 0 },
      availableKg: availableKg.value,
      pricePerKg: props.request.budgetPerKg,
      description: null,
      acceptedContentTypes: [props.request.contentType],
      refusedTypes: [],
      acceptedPaymentMethods: ['STRIPE'],
    })
    announcementId = trip.id
  } catch {
    errorMsg.value = 'Impossible de créer le trajet. Réessayez.'
    isLoading.value = false
    return
  }

  try {
    const thread = await negSvc.startNegotiation({
      packageRequestId: props.request.id,
      proposedPriceEur: proposedPrice.value,
      travelerTravelDate: departureDate.value,
      travelerAvailableKg: availableKg.value,
      travelerAnnouncementId: announcementId,
    })
    emit('success', props.request.id)
    await router.push(`/negociations/${thread.id}`)
  } catch {
    errorMsg.value = 'Trajet créé, mais la négociation a échoué. Retente depuis Mes Trajets.'
    isLoading.value = false
  }
}
</script>

<template>
  <div
    v-if="request"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')" />
    <div class="relative w-full max-w-md bg-surface border border-border rounded-card shadow-2xl overflow-hidden">

      <!-- Header -->
      <div class="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border">
        <div>
          <h3 class="font-semibold text-text">Créer un trajet pour {{ request.senderName }}</h3>
          <p class="text-xs text-text-muted mt-0.5">
            <span>{{ departureCity }}</span>
            <span class="mx-1 text-text-muted/60">→</span>
            <span>{{ arrivalCity }}</span>
          </p>
        </div>
        <button
          class="text-text-muted hover:text-text p-1 transition-colors -mr-1"
          type="button"
          data-test="create-trip-cancel"
          @click="emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </button>
      </div>

      <!-- Récap demande (lecture seule) -->
      <div class="bg-bg px-5 py-3 border-b border-border">
        <p class="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">La demande</p>
        <div class="flex gap-4 text-xs">
          <div>
            <span class="text-text-muted">Poids</span>
            <p class="font-semibold text-text mt-0.5">{{ request.weightKg }} kg</p>
          </div>
          <div>
            <span class="text-text-muted">Type</span>
            <p class="font-semibold text-text mt-0.5">{{ request.contentType }}</p>
          </div>
          <div>
            <span class="text-text-muted">Budget exp.</span>
            <p class="font-semibold text-green-400 mt-0.5">{{ request.budgetPerKg }} €/kg</p>
          </div>
        </div>
      </div>

      <div class="px-5 py-4 space-y-4">

        <!-- Corridor pré-rempli -->
        <div class="bg-green-500/5 border border-green-500/20 rounded-btn px-3 py-2 text-xs">
          <span class="font-semibold text-text">{{ departureCity }} → {{ arrivalCity }}</span>
          <span class="text-text-muted ml-2">· Corridor pré-rempli depuis la demande</span>
        </div>

        <!-- Date de départ -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-text-muted uppercase tracking-wide">Date de départ</label>
          <input
            v-model="departureDate"
            type="date"
            data-test="create-trip-date"
            class="w-full px-3 py-2 rounded-btn bg-bg border border-border text-text text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <!-- Mode de transport -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-text-muted uppercase tracking-wide">Mode de transport</label>
          <div class="flex gap-2">
            <button
              v-for="mode in modes"
              :key="mode.value"
              type="button"
              :class="[
                'flex-1 px-3 py-2 rounded-btn border text-xs font-medium transition-colors',
                transportMode === mode.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-bg text-text-muted hover:text-text hover:border-primary/50',
              ]"
              @click="transportMode = mode.value"
            >
              {{ mode.label }}
            </button>
          </div>
        </div>

        <!-- Capacité disponible -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-text-muted uppercase tracking-wide">Capacité disponible (kg)</label>
          <input
            v-model.number="availableKg"
            type="number"
            min="1"
            max="200"
            data-test="create-trip-kg"
            class="w-full px-3 py-2 rounded-btn bg-bg border border-border text-text text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <!-- Prix proposé avec contrôles +/- -->
        <div class="space-y-2">
          <p class="text-xs font-bold text-text-muted uppercase tracking-wide">Mon prix</p>
          <p class="text-xs text-text-muted">
            Suggéré : <span class="font-semibold text-text">{{ suggestedPrice }} €</span>
            ({{ request.budgetPerKg }} €/kg × {{ request.weightKg }} kg)
          </p>
          <div class="flex items-center gap-3">
            <button
              class="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text hover:border-primary transition-colors text-lg font-light"
              type="button"
              :disabled="proposedPrice <= 1"
              @click="decrement"
            >−</button>
            <div class="flex-1 text-center">
              <p class="text-2xl font-bold text-text" data-test="create-trip-price">{{ proposedPrice }} €</p>
              <p class="text-xs text-text-muted mt-0.5">
                soit {{ request.weightKg > 0 ? (proposedPrice / request.weightKg).toFixed(2) : '—' }} €/kg
              </p>
            </div>
            <button
              class="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text hover:border-primary transition-colors text-lg font-light"
              type="button"
              :disabled="proposedPrice >= suggestedPrice"
              @click="increment"
            >+</button>
          </div>
          <!-- Barre min → max -->
          <div class="h-1 bg-border rounded-full overflow-hidden">
            <div class="h-full bg-primary rounded-full transition-all" :style="{ width: priceBarWidth }" />
          </div>
          <div class="flex justify-between text-xs text-text-muted">
            <span>1 €</span>
            <span>Max {{ suggestedPrice }} €</span>
          </div>
        </div>

        <!-- Erreur -->
        <p v-if="errorMsg" class="text-xs text-red-400">{{ errorMsg }}</p>

        <!-- Actions -->
        <div class="flex gap-2.5">
          <button
            class="flex-1 h-10 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
            type="button"
            data-test="create-trip-cancel"
            @click="emit('close')"
          >Annuler</button>
          <button
            :disabled="!canSubmit"
            data-test="create-trip-submit"
            class="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            @click="submit"
          >
            <span v-if="isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span v-else>Créer le trajet et négocier →</span>
          </button>
        </div>
        <p class="text-center text-xs text-text-muted">Le trajet sera créé et la négociation démarrée en une étape</p>
      </div>
    </div>
  </div>
</template>
