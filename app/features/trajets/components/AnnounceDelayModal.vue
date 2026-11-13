<!-- app/features/trajets/components/AnnounceDelayModal.vue -->
<script setup lang="ts">
import { reactive, computed } from 'vue'
import { Clock } from 'lucide-vue-next'
import { arrivalRangeError } from '@/lib/dates'
import { delayReasons } from '@/features/trajets/lib/delayReasons'
import type { AnnounceDelayPayload, Trip } from '@/features/trajets/types/index'

const props = defineProps<{
  trip: Trip
  isLoading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  submit: [payload: AnnounceDelayPayload]
  cancel: []
}>()

const reasons = computed(() => delayReasons(props.trip.transportMode))

const form = reactive({
  reason: reasons.value[0]!.value,
  arrivalDate: '',
  arrivalDateMax: '',
  message: '',
})

const today = new Date().toISOString().split('T')[0]!

/** Message d'erreur de la fourchette saisie ; null tant qu'elle n'est pas complète ou si elle est valide. */
const arrivalError = computed<string | null>(() => {
  if (!form.arrivalDate || !form.arrivalDateMax) return null
  if (form.arrivalDateMax < today) return 'La nouvelle arrivée ne peut pas être passée'
  return arrivalRangeError(props.trip.departureDate, form.arrivalDate, form.arrivalDateMax)
})

const canSubmit = computed(() =>
  !!form.arrivalDate && !!form.arrivalDateMax && arrivalError.value === null && !props.isLoading,
)

function onSubmit() {
  if (!canSubmit.value) return
  emit('submit', {
    reason: form.reason,
    arrivalDate: form.arrivalDate,
    arrivalDateMax: form.arrivalDateMax,
    message: form.message.trim() || null,
  })
}

const inputClass =
  'flex h-10 w-full rounded-input border border-border-strong bg-surface px-3 py-1 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-[border-color,box-shadow]'
</script>

<template>
  <div
    class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto"
    data-test="delay-modal-backdrop"
    @click.self="emit('cancel')"
  >
    <div class="w-full max-w-lg rounded-card border border-border bg-surface p-6 shadow-pop space-y-4 my-auto">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-el bg-primary/10">
          <Clock class="w-5 h-5 text-primary" />
        </div>
        <h2 class="font-display text-lg font-semibold text-text">Annoncer un retard</h2>
      </div>

      <p class="text-sm text-text-muted">
        Les expéditeurs qui ont un colis sur ce trajet sont prévenus de la nouvelle arrivée estimée.
      </p>

      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="dl-reason">Motif</label>
        <select id="dl-reason" v-model="form.reason" data-test="delay-reason" :class="inputClass">
          <option v-for="r in reasons" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-text mb-1.5" for="dl-min">
            Arrivée au plus tôt <span class="text-danger">*</span>
          </label>
          <input id="dl-min" v-model="form.arrivalDate" type="date" :min="today" data-test="delay-arrival-min" :class="inputClass" />
        </div>
        <div>
          <label class="block text-sm font-medium text-text mb-1.5" for="dl-max">
            Arrivée au plus tard <span class="text-danger">*</span>
          </label>
          <input id="dl-max" v-model="form.arrivalDateMax" type="date" :min="form.arrivalDate || today" data-test="delay-arrival-max" :class="inputClass" />
        </div>
      </div>
      <p v-if="arrivalError" data-test="delay-arrival-error" class="-mt-2 text-xs text-danger">{{ arrivalError }}</p>

      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="dl-message">Message aux expéditeurs (facultatif)</label>
        <textarea id="dl-message" v-model="form.message" maxlength="300" rows="2" data-test="delay-message" :class="[inputClass, 'h-auto py-2']" />
        <p class="mt-1 text-xs text-text-muted text-right"><span class="font-mono tabular-nums">{{ form.message.length }}</span>/300</p>
      </div>

      <p v-if="error" class="text-sm text-danger" data-test="delay-error">{{ error }}</p>

      <div class="flex gap-3 pt-2">
        <button
          data-test="delay-cancel"
          class="flex-1 h-10 rounded-btn border border-border-strong text-sm text-text hover:bg-surface-el transition-colors"
          :disabled="isLoading"
          @click="emit('cancel')"
        >
          Annuler
        </button>
        <button
          data-test="delay-submit"
          class="flex-1 h-10 rounded-btn bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 whitespace-nowrap"
          :disabled="!canSubmit"
          @click="onSubmit"
        >
          {{ isLoading ? 'Envoi…' : 'Annoncer le retard' }}
        </button>
      </div>
    </div>
  </div>
</template>
