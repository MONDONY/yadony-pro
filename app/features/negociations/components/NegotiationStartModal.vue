<!-- app/features/negociations/components/NegotiationStartModal.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { XCircle, MessageSquare } from 'lucide-vue-next'
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

const proposedPrice = ref<number | ''>('')
const message = ref('')
const isLoading = ref(false)
const errorMsg = ref<string | null>(null)

const suggestedPrice = computed(() =>
  props.request
    ? Math.round(props.request.weightKg * props.request.budgetPerKg * 100) / 100
    : 0,
)

function onOpen() {
  proposedPrice.value = suggestedPrice.value
  message.value = ''
  errorMsg.value = null
}

const canSubmit = computed(() =>
  typeof proposedPrice.value === 'number' &&
  proposedPrice.value > 0 &&
  proposedPrice.value <= 500 &&
  !isLoading.value,
)

async function submit() {
  if (!props.request || !canSubmit.value) return
  isLoading.value = true
  errorMsg.value = null
  try {
    const thread = await svc.startNegotiation({
      packageRequestId: props.request.id,
      proposedPriceEur: proposedPrice.value as number,
      travelerTravelDate: props.request.tripDepartureDate,
      travelerAvailableKg: props.request.tripAvailableKg,
      travelerAnnouncementId: props.request.tripId,
      body: message.value.trim() || undefined,
    })
    const requestId = props.request.id
    emit('success', requestId)
    emit('close')
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
      @vue:mounted="onOpen"
      @click.self="emit('close')"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div class="relative w-full max-w-md bg-surface border border-border rounded-card shadow-2xl p-6 space-y-5">

        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="font-semibold text-text">Négocier avec {{ request.senderName }}</h3>
            <p class="text-xs text-text-muted mt-0.5">
              {{ request.weightKg }} kg · {{ request.contentType }} · {{ request.tripCorridor }}
            </p>
          </div>
          <button class="text-text-muted hover:text-text p-1 transition-colors" @click="emit('close')">
            <XCircle class="w-4 h-4" />
          </button>
        </div>

        <!-- Budget expéditeur -->
        <div class="bg-bg rounded-btn px-3 py-2 text-xs text-text-muted">
          Budget expéditeur : <span class="font-semibold text-text">{{ request.budgetPerKg }} €/kg</span>
          · soit <span class="font-semibold text-text">{{ suggestedPrice }} € total</span>
        </div>

        <!-- Prix proposé -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-text-muted">Votre prix proposé (€ total)</label>
          <div class="relative">
            <input
              v-model.number="proposedPrice"
              type="number"
              min="0.01"
              max="500"
              step="0.5"
              placeholder="Ex: 56.00"
              data-test="negociation-prix-input"
              class="w-full h-11 px-4 pr-10 rounded-btn bg-bg border border-border text-text text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">€</span>
          </div>
          <p v-if="typeof proposedPrice === 'number' && proposedPrice > 0" class="text-xs text-text-muted">
            soit {{ (proposedPrice / request.weightKg).toFixed(2) }} €/kg
          </p>
        </div>

        <!-- Message optionnel -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-text-muted">
            <MessageSquare class="w-3 h-3 inline mr-1" />
            Message (optionnel · max 280 car.)
          </label>
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
        <div class="flex items-center gap-2.5 pt-1">
          <button
            class="flex-1 h-10 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
            @click="emit('close')"
          >
            Annuler
          </button>
          <button
            :disabled="!canSubmit"
            class="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-btn bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-test="negociation-submit-btn"
            @click="submit"
          >
            <span v-if="isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span v-else>Envoyer ma proposition</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
