<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { XCircle, Plane } from 'lucide-vue-next'
import { SectionLabel } from '@/components/ui/section-label'
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
      <div data-test="negociation-modal" class="relative w-full max-w-md rounded-card border border-border bg-surface shadow-pop overflow-hidden">

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
          <SectionLabel class="mb-2">La demande</SectionLabel>
          <div class="flex gap-4 text-xs">
            <div>
              <span class="text-text-muted">Poids</span>
              <p class="font-mono font-semibold text-text mt-0.5 tabular-nums">{{ request.weightKg }} kg</p>
            </div>
            <div>
              <span class="text-text-muted">Type</span>
              <p class="font-semibold text-text mt-0.5">{{ request.contentType }}</p>
            </div>
            <div>
              <span class="text-text-muted">Budget exp.</span>
              <p class="font-mono font-semibold text-success mt-0.5 tabular-nums">{{ suggestedPrice }} €</p>
            </div>
          </div>
        </div>

        <!-- Trajet auto-sélectionné (lecture seule) -->
        <div class="px-5 py-3 border-b border-border">
          <SectionLabel class="mb-2">Mon trajet (auto-sélectionné)</SectionLabel>
          <div class="bg-success/5 border border-success/20 rounded-input px-3 py-2 text-xs">
            <span class="inline-flex items-center gap-1.5 font-semibold text-text"><Plane class="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {{ request.tripCorridor }}</span>
            <span class="text-text-muted ml-2">· {{ request.tripDepartureDate }} · <span class="font-mono tabular-nums">{{ request.tripAvailableKg }}</span> kg dispo</span>
          </div>
        </div>

        <div class="px-5 py-4 space-y-4">
          <!-- Prix proposé avec contrôles +/- -->
          <div class="space-y-2">
            <div class="flex items-baseline justify-between">
              <SectionLabel>Mon prix total</SectionLabel>
              <span class="text-xs text-text-muted">pour <span class="font-mono tabular-nums">{{ request.weightKg }}</span> kg</span>
            </div>
            <p class="text-xs text-text-muted">
              Budget expéditeur : <span class="font-mono font-semibold text-success tabular-nums">{{ suggestedPrice }} €</span>
              <span class="text-text-muted/70"> (<span class="font-mono tabular-nums">{{ request.budgetPerKg }}</span> €/kg × <span class="font-mono tabular-nums">{{ request.weightKg }}</span> kg)</span>
            </p>
            <div class="flex items-center gap-2 bg-bg border border-border rounded-input px-4 py-3 focus-within:border-primary transition-colors">
              <input
                :value="proposedPrice"
                type="number"
                min="1"
                :max="maxPrice"
                inputmode="numeric"
                data-test="proposed-price"
                class="flex-1 text-center text-3xl font-mono font-semibold text-text bg-transparent outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                @input="onPriceInput"
              />
              <span class="text-2xl font-semibold text-text-muted shrink-0">€</span>
            </div>
            <p class="text-xs text-text-muted text-center -mt-1">
              soit <span class="font-mono tabular-nums">{{ request.weightKg > 0 ? (proposedPrice / request.weightKg).toFixed(2) : '—' }}</span> €/kg
            </p>
            <!-- Barre min → max -->
            <div class="h-1.5 bg-surface-el rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all duration-150" :style="{ width: priceBarWidth }" />
            </div>
            <div class="flex justify-between text-xs text-text-muted font-mono tabular-nums">
              <span>1 €</span>
              <span>Max {{ maxPrice }} €</span>
            </div>
          </div>

          <!-- Message optionnel -->
          <div class="space-y-1.5">
            <label class="text-2xs font-semibold uppercase tracking-[0.12em] text-text-subtle">Message (optionnel)</label>
            <textarea
              v-model="message"
              maxlength="280"
              rows="3"
              placeholder="Présentez-vous, précisez vos disponibilités…"
              data-test="negociation-message-input"
              class="w-full px-3 py-2 rounded-input bg-bg border border-border text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
            />
            <p class="text-right text-xs text-text-muted font-mono tabular-nums">{{ message.length }}/280</p>
          </div>

          <!-- Erreur -->
          <p v-if="errorMsg" class="text-xs text-danger">{{ errorMsg }}</p>

          <!-- Actions -->
          <div class="flex gap-2.5">
            <button
              class="flex-1 h-10 rounded-btn border border-border-strong text-sm text-text hover:bg-surface-el transition-colors"
              type="button"
              @click="emit('close')"
            >Annuler</button>
            <button
              :disabled="!canSubmit"
              data-test="negociation-submit-btn"
              class="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-btn bg-primary text-on-primary text-sm font-semibold shadow-btn hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              @click="submit"
            >
              <span v-if="isLoading" class="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              <span v-else>Envoyer ma proposition →</span>
            </button>
          </div>
          <p class="text-center text-xs text-text-muted">L'expéditeur a 48h pour répondre</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
