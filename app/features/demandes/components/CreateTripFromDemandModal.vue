<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plane, Car, Train, Minus, Plus, X } from 'lucide-vue-next'
import { SectionLabel } from '@/components/ui/section-label'
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
  !!departureDate.value && proposedPrice.value > 0 && proposedPrice.value <= 500 && !isLoading.value,
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
  const maxAllowed = Math.min(suggestedPrice.value, 500)
  if (proposedPrice.value < maxAllowed) proposedPrice.value++
}

const priceBarWidth = computed(() => {
  if (suggestedPrice.value === 0) return '100%'
  return `${Math.min(100, (proposedPrice.value / suggestedPrice.value) * 100)}%`
})

// ── Transport mode chips ─────────────────────────────────────────────────────
const modes = [
  { value: 'PLANE' as const, label: 'Avion', icon: Plane },
  { value: 'CAR' as const, label: 'Voiture', icon: Car },
  { value: 'TRAIN' as const, label: 'Train', icon: Train },
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
    <div class="relative w-full max-w-md bg-surface border border-border rounded-el shadow-pop overflow-hidden">

      <!-- Header -->
      <div class="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border">
        <div>
          <h3 class="font-semibold text-text">Créer un trajet pour {{ request.senderName }}</h3>
          <p class="text-xs text-text-muted mt-0.5">
            <span>{{ departureCity }}</span>
            <span class="mx-1 text-primary">→</span>
            <span>{{ arrivalCity }}</span>
          </p>
        </div>
        <button
          class="text-text-muted hover:text-text p-1 transition-colors -mr-1"
          type="button"
          data-test="create-trip-close"
          @click="emit('close')"
        >
          <X class="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <!-- Récap demande (lecture seule) -->
      <div class="bg-surface-el px-5 py-3 border-b border-border">
        <SectionLabel class="mb-2">La demande</SectionLabel>
        <div class="flex gap-4 text-xs">
          <div>
            <span class="text-text-subtle">Poids</span>
            <p class="font-mono font-semibold text-text mt-0.5 tabular-nums">{{ request.weightKg }} kg</p>
          </div>
          <div>
            <span class="text-text-subtle">Type</span>
            <p class="font-semibold text-text mt-0.5">{{ request.contentType }}</p>
          </div>
          <div>
            <span class="text-text-subtle">Budget exp.</span>
            <p class="font-mono font-semibold text-success mt-0.5 tabular-nums">{{ request.budgetPerKg }} €/kg</p>
          </div>
        </div>
      </div>

      <div class="px-5 py-4 space-y-4">

        <!-- Corridor pré-rempli -->
        <div class="bg-success/5 border border-success/20 rounded-el px-3 py-2 text-xs">
          <span class="font-semibold text-text">{{ departureCity }} → {{ arrivalCity }}</span>
          <span class="text-text-muted ml-2">· Corridor pré-rempli depuis la demande</span>
        </div>

        <!-- Date de départ -->
        <div class="space-y-1.5">
          <SectionLabel as="label">Date de départ</SectionLabel>
          <input
            v-model="departureDate"
            type="date"
            data-test="create-trip-date"
            class="w-full px-3 py-2 rounded-input bg-surface-el border border-border-strong text-text text-sm font-mono tabular-nums focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 transition-[border-color,box-shadow]"
          />
        </div>

        <!-- Mode de transport -->
        <div class="space-y-1.5">
          <SectionLabel as="p">Mode de transport</SectionLabel>
          <div class="flex gap-2">
            <button
              v-for="mode in modes"
              :key="mode.value"
              type="button"
              :class="[
                'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-btn border text-xs font-medium transition-colors',
                transportMode === mode.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface-el text-text-muted hover:text-text hover:border-primary/50',
              ]"
              @click="transportMode = mode.value"
            >
              <component :is="mode.icon" class="h-3.5 w-3.5" aria-hidden="true" />
              {{ mode.label }}
            </button>
          </div>
        </div>

        <!-- Capacité disponible -->
        <div class="space-y-1.5">
          <SectionLabel as="label">Capacité disponible (kg)</SectionLabel>
          <input
            v-model.number="availableKg"
            type="number"
            min="1"
            max="200"
            data-test="create-trip-kg"
            class="w-full px-3 py-2 rounded-input bg-surface-el border border-border-strong text-text text-sm font-mono tabular-nums focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 transition-[border-color,box-shadow]"
          />
        </div>

        <!-- Prix proposé avec contrôles +/- -->
        <div class="space-y-2">
          <SectionLabel as="p">Mon prix</SectionLabel>
          <p class="text-xs text-text-muted">
            Suggéré : <span class="font-mono font-semibold text-text tabular-nums">{{ suggestedPrice }} €</span>
            (<span class="font-mono tabular-nums">{{ request.budgetPerKg }}</span> €/kg × <span class="font-mono tabular-nums">{{ request.weightKg }}</span> kg)
          </p>
          <div class="flex items-center gap-3">
            <button
              class="w-9 h-9 rounded-full border border-border-strong flex items-center justify-center text-text-muted hover:text-text hover:border-primary transition-colors"
              type="button"
              :disabled="proposedPrice <= 1"
              @click="decrement"
            ><Minus class="h-4 w-4" aria-hidden="true" /></button>
            <div class="flex-1 text-center">
              <p class="text-2xl font-mono font-semibold text-text tabular-nums" data-test="create-trip-price">{{ proposedPrice }} €</p>
              <p class="text-xs text-text-muted mt-0.5">
                soit <span class="font-mono tabular-nums">{{ request.weightKg > 0 ? (proposedPrice / request.weightKg).toFixed(2) : '—' }}</span> €/kg
              </p>
            </div>
            <button
              class="w-9 h-9 rounded-full border border-border-strong flex items-center justify-center text-text-muted hover:text-text hover:border-primary transition-colors"
              type="button"
              :disabled="proposedPrice >= suggestedPrice"
              @click="increment"
            ><Plus class="h-4 w-4" aria-hidden="true" /></button>
          </div>
          <!-- Barre min → max -->
          <div class="h-1 bg-surface-el rounded-full overflow-hidden">
            <div class="h-full bg-primary rounded-full transition-all" :style="{ width: priceBarWidth }" />
          </div>
          <div class="flex justify-between text-xs text-text-muted font-mono tabular-nums">
            <span>1 €</span>
            <span>Max {{ suggestedPrice }} €</span>
          </div>
        </div>

        <!-- Erreur -->
        <p v-if="errorMsg" class="text-xs text-danger">{{ errorMsg }}</p>

        <!-- Actions -->
        <div class="flex gap-2.5">
          <button
            class="flex-1 h-10 rounded-btn border border-border-strong text-sm text-text hover:bg-surface-el transition-colors"
            type="button"
            data-test="create-trip-cancel"
            @click="emit('close')"
          >Annuler</button>
          <button
            :disabled="!canSubmit"
            data-test="create-trip-submit"
            class="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-btn bg-primary text-on-primary text-sm font-semibold shadow-btn hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            @click="submit"
          >
            <span v-if="isLoading" class="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            <span v-else>Créer le trajet et négocier →</span>
          </button>
        </div>
        <p class="text-center text-xs text-text-muted">Le trajet sera créé et la négociation démarrée en une étape</p>
      </div>
    </div>
  </div>
</template>
