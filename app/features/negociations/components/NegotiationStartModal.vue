<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { XCircle } from 'lucide-vue-next'
import { negotiationService } from '@/features/negociations/services/negotiationService'
import type { MatchingRequest } from '@/features/demandes/types/index'

const props = defineProps<{
  request: MatchingRequest | null
}>()

const emit = defineEmits<{
  'close': []
  'success': [requestId: string]
}>()

const router = useRouter()
const svc = negotiationService()

const proposedPrice = ref(0)
const message = ref('')
const isLoading = ref(false)
const errorMsg = ref<string | null>(null)

const suggestedPrice = computed(() =>
  props.request ? Math.round(props.request.budgetPerKg * props.request.weightKg) : 0,
)

const maxPrice = computed(() =>
  props.request ? Math.round(props.request.budgetPerKg * props.request.weightKg) : 500,
)

watch(() => props.request, (req) => {
  if (req) {
    proposedPrice.value = Math.round(req.budgetPerKg * req.weightKg)
    message.value = ''
    errorMsg.value = null
  }
}, { immediate: true })

function onPriceInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const n = parseInt(raw, 10)
  if (!Number.isNaN(n) && n >= 0) proposedPrice.value = n
}

const priceBarWidth = computed(() => {
  if (maxPrice.value === 0) return '100%'
  return `${Math.min(100, (proposedPrice.value / maxPrice.value) * 100)}%`
})

const canSubmit = computed(() =>
  proposedPrice.value > 0 && proposedPrice.value <= 500 && !isLoading.value,
)

async function submit() {
  if (!props.request || !canSubmit.value) return
  isLoading.value = true
  errorMsg.value = null
  try {
    const thread = await svc.startNegotiation({
      packageRequestId: props.request.id,
      proposedPriceEur: proposedPrice.value,
      travelerTravelDate: props.request.tripDepartureDate,
      travelerAvailableKg: props.request.tripAvailableKg,
      travelerAnnouncementId: props.request.tripId,
      body: message.value.trim() || undefined,
    })
    emit('success', props.request.id)
    await router.push(`/negociations/${thread.id}`)
  } catch {
    errorMsg.value = 'Impossible de démarrer la négociation. Réessayez.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="request"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div data-test="negociation-modal" class="relative w-full max-w-md bg-surface border border-border rounded-card shadow-2xl overflow-hidden">

        <!-- Header -->
        <div class="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border">
          <div>
            <h3 class="font-semibold text-text">Négocier avec {{ request.senderName }}</h3>
            <p class="text-xs text-text-muted mt-0.5">{{ request.tripCorridor }}</p>
          </div>
          <button class="text-text-muted hover:text-text p-1 transition-colors -mr-1" type="button" @click="emit('close')">
            <XCircle class="w-4 h-4" />
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
              <p class="font-semibold text-green-400 mt-0.5">{{ suggestedPrice }} €</p>
            </div>
          </div>
        </div>

        <!-- Trajet auto-sélectionné (lecture seule) -->
        <div class="px-5 py-3 border-b border-border">
          <p class="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">Mon trajet (auto-sélectionné)</p>
          <div class="bg-green-500/5 border border-green-500/20 rounded-btn px-3 py-2 text-xs">
            <span class="font-semibold text-text">✈️ {{ request.tripCorridor }}</span>
            <span class="text-text-muted ml-2">· {{ request.tripDepartureDate }} · {{ request.tripAvailableKg }} kg dispo</span>
          </div>
        </div>

        <div class="px-5 py-4 space-y-4">
          <!-- Prix proposé avec contrôles +/- -->
          <div class="space-y-2">
            <div class="flex items-baseline justify-between">
              <p class="text-xs font-bold text-text-muted uppercase tracking-wide">Mon prix total</p>
              <span class="text-xs text-text-muted">pour {{ request.weightKg }} kg</span>
            </div>
            <p class="text-xs text-text-muted">
              Budget expéditeur : <span class="font-semibold text-green-400">{{ suggestedPrice }} €</span>
              <span class="text-text-muted/70"> ({{ request.budgetPerKg }} €/kg × {{ request.weightKg }} kg)</span>
            </p>
            <div class="flex items-center gap-2 bg-bg border border-border rounded-xl px-4 py-3 focus-within:border-primary transition-colors">
              <input
                :value="proposedPrice"
                type="number"
                min="1"
                :max="maxPrice"
                inputmode="numeric"
                data-test="proposed-price"
                class="flex-1 text-center text-3xl font-bold text-text bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                @input="onPriceInput"
              />
              <span class="text-2xl font-bold text-text-muted shrink-0">€</span>
            </div>
            <p class="text-xs text-text-muted text-center -mt-1">
              soit {{ request.weightKg > 0 ? (proposedPrice / request.weightKg).toFixed(2) : '—' }} €/kg
            </p>
            <!-- Barre min → max -->
            <div class="h-1.5 bg-border rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all duration-150" :style="{ width: priceBarWidth }" />
            </div>
            <div class="flex justify-between text-xs text-text-muted">
              <span>1 €</span>
              <span>Max {{ maxPrice }} €</span>
            </div>
          </div>

          <!-- Message optionnel -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-text-muted uppercase tracking-wide">Message (optionnel)</label>
            <textarea
              v-model="message"
              maxlength="280"
              rows="3"
              placeholder="Présentez-vous, précisez vos disponibilités…"
              data-test="negociation-message-input"
              class="w-full px-3 py-2 rounded-btn bg-bg border border-border text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
            />
            <p class="text-right text-xs text-text-muted">{{ message.length }}/280</p>
          </div>

          <!-- Erreur -->
          <p v-if="errorMsg" class="text-xs text-red-400">{{ errorMsg }}</p>

          <!-- Actions -->
          <div class="flex gap-2.5">
            <button
              class="flex-1 h-10 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
              type="button"
              @click="emit('close')"
            >Annuler</button>
            <button
              :disabled="!canSubmit"
              data-test="negociation-submit-btn"
              class="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              @click="submit"
            >
              <span v-if="isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span v-else>Envoyer ma proposition →</span>
            </button>
          </div>
          <p class="text-center text-xs text-text-muted">L'expéditeur a 48h pour répondre</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
