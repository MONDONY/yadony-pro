<!-- app/features/trajets/components/RescheduleTripModal.vue -->
<script setup lang="ts">
import { reactive, computed } from 'vue'
import { CalendarClock } from 'lucide-vue-next'
import { arrivalDateError, deadlineToIso } from '@/lib/dates'
import type { RescheduleReason, RescheduleTripPayload, Trip } from '@/features/trajets/types/index'

const props = defineProps<{
  trip: Trip
  isLoading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  submit: [payload: RescheduleTripPayload]
  cancel: []
}>()

const reasons: Array<{ value: RescheduleReason; label: string }> = [
  { value: 'FLIGHT_CANCELLED', label: 'Vol annulé' },
  { value: 'POSTPONED', label: 'Voyage repoussé' },
  { value: 'OTHER', label: 'Autre raison' },
]

const form = reactive({
  reason: 'POSTPONED' as RescheduleReason,
  departureDate: '',
  departureTime: props.trip.departureTime ?? '',
  arrivalDate: '',
  arrivalTime: props.trip.arrivalTime ?? '',
  handoverDeadline: '',
  note: '',
})

const today = new Date().toISOString().split('T')[0]!

const errors = computed(() => {
  const e: Record<string, string> = {}
  if (!form.departureDate) e.departureDate = 'Nouvelle date de départ requise'
  else if (form.departureDate < today) e.departureDate = 'La nouvelle date doit être dans le futur'
  if (!form.departureTime) e.departureTime = 'Heure de départ requise'
  if (
    form.departureDate === props.trip.departureDate
    && form.departureTime
    && form.departureTime === (props.trip.departureTime ?? '')
  ) {
    e.departureTime = 'Choisissez une date ou une heure différente de l’actuelle'
  }
  const arrival = arrivalDateError(form.departureDate, form.departureTime, form.arrivalDate, form.arrivalTime)
  if (arrival) e.arrivalDate = arrival
  if (!form.handoverDeadline) e.handoverDeadline = 'Date limite de remise requise'
  else if (form.departureDate && form.handoverDeadline > form.departureDate) {
    e.handoverDeadline = 'La date limite de remise doit précéder le départ'
  }
  return e
})

const canSubmit = computed(() => Object.keys(errors.value).length === 0 && !props.isLoading)

const remaining = computed(() => props.trip.remainingReschedules ?? null)

function onSubmit() {
  if (!canSubmit.value) return
  emit('submit', {
    departureDate: form.departureDate,
    departureTime: form.departureTime,
    arrivalDate: form.arrivalDate || null,
    arrivalTime: form.arrivalTime || null,
    handoverDeadline: deadlineToIso(form.handoverDeadline, form.departureDate, form.departureTime)!,
    reason: form.reason,
    note: form.note.trim() || null,
  })
}

const inputClass =
  'flex h-10 w-full rounded-input border border-border-strong bg-surface px-3 py-1 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-[border-color,box-shadow]'
</script>

<template>
  <div
    class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto"
    data-test="reschedule-modal-backdrop"
    @click.self="emit('cancel')"
  >
    <div class="w-full max-w-lg rounded-card border border-border bg-surface p-6 shadow-pop space-y-4 my-auto">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-el bg-primary/10">
          <CalendarClock class="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 class="font-display text-lg font-semibold text-text">Reporter ce trajet</h2>
          <p v-if="remaining !== null" class="text-xs text-text-muted" data-test="reschedule-remaining">
            {{ remaining }} report{{ remaining > 1 ? 's' : '' }} restant{{ remaining > 1 ? 's' : '' }} sur 2
          </p>
        </div>
      </div>

      <p class="text-sm text-text-muted">
        Les expéditeurs concernés sont prévenus. Ceux dont le colis est accepté ou remis choisissent
        de le garder sur le nouveau trajet ou de se retirer sans frais.
      </p>

      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="rs-reason">Motif</label>
        <select id="rs-reason" v-model="form.reason" data-test="reschedule-reason" :class="inputClass">
          <option v-for="r in reasons" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-text mb-1.5" for="rs-dep-date">
            Nouveau départ <span class="text-danger">*</span>
          </label>
          <input id="rs-dep-date" v-model="form.departureDate" type="date" :min="today" data-test="reschedule-departure-date" :class="inputClass" />
          <p v-if="errors.departureDate && form.departureDate" class="mt-1 text-xs text-danger">{{ errors.departureDate }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-text mb-1.5" for="rs-dep-time">
            Heure de départ <span class="text-danger">*</span>
          </label>
          <input id="rs-dep-time" v-model="form.departureTime" type="time" data-test="reschedule-departure-time" :class="inputClass" />
          <p v-if="errors.departureTime && form.departureTime" class="mt-1 text-xs text-danger">{{ errors.departureTime }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-text mb-1.5" for="rs-arr-date">Date d’arrivée</label>
          <input id="rs-arr-date" v-model="form.arrivalDate" type="date" :min="form.departureDate || today" data-test="reschedule-arrival-date" :class="inputClass" />
          <p v-if="errors.arrivalDate" class="mt-1 text-xs text-danger">{{ errors.arrivalDate }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-text mb-1.5" for="rs-arr-time">Heure d’arrivée</label>
          <input id="rs-arr-time" v-model="form.arrivalTime" type="time" data-test="reschedule-arrival-time" :class="inputClass" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="rs-deadline">
          Date limite de remise <span class="text-danger">*</span>
        </label>
        <input id="rs-deadline" v-model="form.handoverDeadline" type="date" :max="form.departureDate || undefined" data-test="reschedule-deadline" :class="inputClass" />
        <p v-if="errors.handoverDeadline && form.handoverDeadline" class="mt-1 text-xs text-danger">{{ errors.handoverDeadline }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="rs-note">Message aux expéditeurs (facultatif)</label>
        <textarea id="rs-note" v-model="form.note" maxlength="300" rows="2" data-test="reschedule-note" :class="[inputClass, 'h-auto py-2']" />
        <p class="mt-1 text-xs text-text-muted text-right"><span class="font-mono tabular-nums">{{ form.note.length }}</span>/300</p>
      </div>

      <p v-if="error" class="text-sm text-danger" data-test="reschedule-error">{{ error }}</p>

      <div class="flex gap-3 pt-2">
        <button
          data-test="reschedule-cancel"
          class="flex-1 h-10 rounded-btn border border-border-strong text-sm text-text hover:bg-surface-el transition-colors"
          :disabled="isLoading"
          @click="emit('cancel')"
        >
          Annuler
        </button>
        <button
          data-test="reschedule-submit"
          class="flex-1 h-10 rounded-btn bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          :disabled="!canSubmit"
          @click="onSubmit"
        >
          {{ isLoading ? 'Report en cours…' : 'Reporter le trajet' }}
        </button>
      </div>
    </div>
  </div>
</template>
