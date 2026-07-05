<!-- app/features/negociations/components/NegotiationCreateTripModal.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import type { CreateDedicatedTripPayload } from '@/features/negociations/types'

const props = defineProps<{
  open: boolean
  prefillDate: string      // travelerTravelDate ISO (YYYY-MM-DD)
  prefillKg: number        // travelerAvailableKg
  isLoading: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: CreateDedicatedTripPayload]
}>()

const departureDate = ref(props.prefillDate)
const availableKg = ref(props.prefillKg)
const note = ref('')
const error = ref<string | null>(null)

watch(() => props.open, (val) => {
  if (val) {
    departureDate.value = props.prefillDate
    availableKg.value = props.prefillKg
    note.value = ''
    error.value = null
  }
})

function onSubmit() {
  if (!departureDate.value) {
    error.value = 'La date de départ est requise.'
    return
  }
  if (availableKg.value <= 0) {
    error.value = 'La capacité doit être supérieure à 0.'
    return
  }
  error.value = null
  emit('submit', {
    departureDate: departureDate.value,
    availableKg: availableKg.value,
    body: note.value || undefined,
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')" />
      <div class="relative w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-pop space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-text">Créer un trajet dédié</h3>
          <button
            class="p-1 rounded-btn text-text-muted hover:text-text transition-colors"
            @click="emit('close')"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <p class="text-xs text-text-muted">
          Ce trajet sera privé et lié exclusivement à cette demande d'envoi.
        </p>

        <!-- Champs -->
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-text-muted mb-1">Date de départ</label>
            <input
              v-model="departureDate"
              type="date"
              class="w-full h-10 px-3 rounded-input border border-border bg-transparent text-sm text-text font-mono tabular-nums focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-muted mb-1">Capacité disponible (kg)</label>
            <input
              v-model.number="availableKg"
              type="number"
              min="0.1"
              step="0.5"
              class="w-full h-10 px-3 rounded-input border border-border bg-transparent text-sm text-text font-mono tabular-nums focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-muted mb-1">Note (optionnel)</label>
            <input
              v-model="note"
              type="text"
              maxlength="280"
              placeholder="Ex. : Vol Air France AF558"
              class="w-full h-10 px-3 rounded-input border border-border bg-transparent text-sm text-text focus:border-primary focus:outline-none placeholder:text-text-muted/50"
            />
          </div>
        </div>

        <!-- Erreur -->
        <p v-if="error" class="text-xs text-danger">{{ error }}</p>

        <!-- Actions -->
        <div class="flex gap-2.5 pt-1">
          <button
            class="flex-1 h-10 rounded-btn border border-border-strong text-sm text-text hover:bg-surface-el transition-colors"
            @click="emit('close')"
          >
            Annuler
          </button>
          <button
            :disabled="isLoading"
            class="flex-1 flex items-center justify-center h-10 rounded-btn bg-primary text-on-primary text-sm font-medium shadow-btn hover:bg-primary-hover transition-colors disabled:opacity-50"
            @click="onSubmit"
          >
            <span v-if="isLoading" class="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            <span v-else>Confirmer le trajet</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
