<!-- app/features/negociations/components/NegotiationCounterModal.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XCircle } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  currentPriceEur: number
  weightKg: number
  isLoading: boolean
}>()

const emit = defineEmits<{
  'close': []
  'submit': [proposedPriceEur: number, body?: string]
}>()

const price = ref<number | ''>(props.currentPriceEur)
const message = ref('')

function onOpen() {
  price.value = props.currentPriceEur
  message.value = ''
}

const canSubmit = computed(() =>
  typeof price.value === 'number' && price.value > 0 && price.value <= 500 && !props.isLoading,
)

function submit() {
  if (!canSubmit.value) return
  emit('submit', price.value as number, message.value.trim() || undefined)
}

watch(() => props.open, (val) => {
  if (val) onOpen()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div class="relative w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-pop space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-text">Contre-proposition</h3>
          <button class="text-text-muted hover:text-text p-1" @click="emit('close')">
            <XCircle class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium text-text-muted">Votre nouveau prix (€ total)</label>
          <div class="relative">
            <input
              v-model.number="price"
              type="number"
              min="0.01"
              max="500"
              step="0.5"
              placeholder="Ex: 48.00"
              data-test="counter-price-input"
              class="w-full h-11 px-4 pr-10 rounded-input bg-bg border border-border text-text text-sm font-mono tabular-nums focus:outline-none focus:border-primary transition-colors"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">€</span>
          </div>
          <p v-if="typeof price === 'number' && price > 0" class="text-xs text-text-muted">
            soit <span class="font-mono tabular-nums">{{ (price / weightKg).toFixed(2) }}</span> €/kg
          </p>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium text-text-muted">Message (optionnel · max 280 car.)</label>
          <textarea
            v-model="message"
            maxlength="280"
            rows="2"
            placeholder="Précisez votre offre…"
            data-test="counter-message-input"
            class="w-full px-3 py-2 rounded-input bg-bg border border-border text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        <div class="flex gap-2.5 pt-1">
          <button
            class="flex-1 h-10 rounded-btn border border-border-strong text-sm text-text hover:bg-surface-el transition-colors"
            @click="emit('close')"
          >
            Annuler
          </button>
          <button
            :disabled="!canSubmit"
            class="flex-1 flex items-center justify-center h-10 rounded-btn bg-primary text-on-primary text-sm font-medium shadow-btn hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-test="counter-submit-btn"
            @click="submit"
          >
            <span v-if="isLoading" class="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            <span v-else>Envoyer</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
