<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronDown, LayoutTemplate } from 'lucide-vue-next'
import { useAnnouncementForm } from '@/features/trajets/composables/useAnnouncementForm'
import { useTrips } from '@/features/trajets/composables/useTrips'
import { configService } from '@/features/trajets/services/configService'
import GooglePlacesInput from '@/features/trajets/components/GooglePlacesInput.vue'
import TransportModeChips from '@/features/trajets/components/TransportModeChips.vue'
import WeightSlider from '@/features/trajets/components/WeightSlider.vue'
import CapacitySelector from '@/features/trajets/components/CapacitySelector.vue'
import PriceOptionCards from '@/features/trajets/components/PriceOptionCards.vue'
import ContentTagChips from '@/features/trajets/components/ContentTagChips.vue'
import { Button } from '@/components/ui/button'
import type { Trip, ValidationErrors } from '@/features/trajets/types/index'

const emit = defineEmits<{
  submitted: [trip: Trip]
}>()

const props = withDefaults(defineProps<{
  prefill?: Trip
  editTripId?: string
}>(), {
  prefill: undefined,
  editTripId: undefined,
})

const { form, netPrice, validate, submit, submitEdit, applyTemplate } = useAnnouncementForm()
const { fetchTemplates } = useTrips()
const { fetchContentCategories } = configService()

const errors = ref<ValidationErrors>({})
const isSubmitting = ref(false)
const templates = ref<Trip[]>([])
const showTemplates = ref(false)
const selectedTemplateId = ref<string | null>(null)
const acceptedPresets = ref<string[]>([])

const today = new Date()
const minDate = computed(() => {
  const d = new Date(today)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
})
const maxDate = computed(() => {
  const d = new Date(today)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
})

const REFUSED_PRESETS: string[] = []

onMounted(async () => {
  const [fetchedTemplates, fetchedCategories] = await Promise.all([
    fetchTemplates(),
    fetchContentCategories(),
  ])
  templates.value = fetchedTemplates
  acceptedPresets.value = fetchedCategories
  if (props.prefill) {
    applyTemplate(props.prefill)
  }
})

function onSelectTemplate(trip: Trip) {
  applyTemplate(trip)
  selectedTemplateId.value = trip.id
  showTemplates.value = false
}

async function handleSubmit(status: 'DRAFT' | 'PUBLISHED') {
  const validationErrors = validate()
  errors.value = validationErrors
  if (Object.keys(validationErrors).length > 0) return

  isSubmitting.value = true
  try {
    const trip = props.editTripId
      ? await submitEdit(props.editTripId)
      : await submit(status)
    emit('submitted', trip)
  } catch {
    errors.value.global = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl space-y-8">

    <!-- Template picker -->
    <div v-if="templates.length > 0" class="bg-surface border border-border rounded-card p-4">
      <button
        type="button"
        class="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors w-full"
        @click="showTemplates = !showTemplates"
      >
        <LayoutTemplate class="w-4 h-4" />
        Réutiliser un trajet précédent comme modèle
        <ChevronDown :class="['w-4 h-4 ml-auto transition-transform', showTemplates && 'rotate-180']" />
      </button>
      <div v-if="showTemplates" class="mt-3 space-y-2">
        <button
          v-for="t in templates"
          :key="t.id"
          type="button"
          :class="[
            'w-full text-left px-4 py-3 rounded-btn border text-sm transition-colors',
            selectedTemplateId === t.id
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:border-primary/50 text-text-muted hover:text-text',
          ]"
          @click="onSelectTemplate(t)"
        >
          <span class="font-medium">{{ t.departureCity.label }} → {{ t.arrivalCity.label }}</span>
          <span class="ml-2 text-xs">· {{ t.pricePerKg }}€/kg · {{ t.availableWeightKg }} kg</span>
        </button>
      </div>
    </div>

    <!-- Section Trajet -->
    <section class="space-y-5">
      <h2 class="font-bold text-lg text-text border-b border-border pb-2">Trajet</h2>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-text mb-1.5">
            Ville de départ <span class="text-red-500">*</span>
          </label>
          <GooglePlacesInput
            v-model="form.departureCity"
            placeholder="Ex : Paris"
            :error="errors.departureCity"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-text mb-1.5">Heure de départ</label>
          <input
            v-model="form.departureTime"
            type="time"
            class="flex h-10 w-full rounded-btn border border-border bg-surface px-3 py-1 text-sm text-text focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-text mb-1.5">
            Ville d'arrivée <span class="text-red-500">*</span>
          </label>
          <GooglePlacesInput
            v-model="form.arrivalCity"
            placeholder="Ex : Dakar"
            :error="errors.arrivalCity"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-text mb-1.5">Heure d'arrivée</label>
          <input
            v-model="form.arrivalTime"
            type="time"
            class="flex h-10 w-full rounded-btn border border-border bg-surface px-3 py-1 text-sm text-text focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-text mb-1.5">
          Date de départ <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.departureDate"
          type="date"
          :min="minDate"
          :max="maxDate"
          :class="[
            'flex h-10 w-full rounded-btn border bg-surface px-3 py-1 text-sm text-text focus:outline-none focus:border-primary transition-colors',
            errors.departureDate ? 'border-red-500' : 'border-border',
          ]"
        />
        <p v-if="errors.departureDate" class="mt-1 text-xs text-red-500">{{ errors.departureDate }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-text mb-1.5">
          Mode de transport <span class="text-red-500">*</span>
        </label>
        <TransportModeChips v-model="form.transportMode" :error="errors.transportMode" />
      </div>
    </section>

    <!-- Section Lieux de remise -->
    <section class="space-y-5">
      <h2 class="font-bold text-lg text-text border-b border-border pb-2">Lieux de remise</h2>
      <div>
        <label class="block text-sm font-medium text-text mb-1.5">
          Lieu de remise du colis <span class="text-red-500">*</span>
        </label>
        <GooglePlacesInput
          v-model="form.pickupPlace"
          placeholder="Ex : 12 rue de la Paix, Paris"
          :error="errors.pickupPlace"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-text mb-1.5">
          Lieu de récupération <span class="text-red-500">*</span>
        </label>
        <GooglePlacesInput
          v-model="form.dropoffPlace"
          placeholder="Ex : Aéroport Léopold Sédar Senghor"
          :error="errors.dropoffPlace"
        />
      </div>
    </section>

    <!-- Section Capacité & Prix -->
    <section class="space-y-5">
      <h2 class="font-bold text-lg text-text border-b border-border pb-2">Capacité & Prix</h2>
      <CapacitySelector v-model="form.capacityUnit" />
      <WeightSlider v-model="form.availableWeightKg" :min="1" :max="23" />
      <div>
        <label class="block text-sm font-medium text-text mb-3">
          Prix par kg <span class="text-red-500">*</span>
        </label>
        <PriceOptionCards v-model="form.pricePerKg" />
        <p class="mt-2 text-xs text-text-muted">
          Commission dony (12%) déduite · Vous recevez
          <span class="text-text font-medium">{{ netPrice.toFixed(2) }}€/kg</span>
        </p>
      </div>
    </section>

    <!-- Section Contenu -->
    <section class="space-y-5">
      <h2 class="font-bold text-lg text-text border-b border-border pb-2">Contenu accepté</h2>
      <div>
        <label class="block text-sm font-medium text-text mb-3">Ce que j'accepte</label>
        <ContentTagChips
          v-model="form.acceptedCategories"
          :presets="acceptedPresets"
          placeholder="Ajouter une catégorie…"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-text mb-3">Ce que je refuse</label>
        <ContentTagChips
          v-model="form.refusedCategories"
          :presets="REFUSED_PRESETS"
          placeholder="Ex : Liquides, matières dangereuses…"
        />
      </div>
    </section>

    <!-- Section Note & Paiement -->
    <section class="space-y-5">
      <h2 class="font-bold text-lg text-text border-b border-border pb-2">Note & Paiement</h2>
      <div>
        <label class="block text-sm font-medium text-text mb-1.5">Note aux expéditeurs</label>
        <textarea
          v-model="form.senderNote"
          :maxlength="500"
          rows="4"
          placeholder="Informations complémentaires pour les expéditeurs…"
          class="w-full rounded-btn border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none transition-colors"
        />
        <p class="mt-1 text-xs text-text-muted text-right">{{ form.senderNote.length }}/500</p>
      </div>

      <div class="flex items-center justify-between p-4 rounded-card border border-border bg-bg">
        <div>
          <p class="text-sm font-medium text-text">Paiement en espèces</p>
          <p class="text-xs text-text-muted mt-0.5">La carte bancaire Stripe est toujours activée</p>
        </div>
        <button
          type="button"
          :class="['relative w-10 h-6 rounded-full transition-colors', form.cashAccepted ? 'bg-primary' : 'bg-border']"
          :aria-pressed="form.cashAccepted"
          data-test="cash-toggle"
          @click="form.cashAccepted = !form.cashAccepted"
        >
          <span :class="['absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', form.cashAccepted ? 'translate-x-5' : 'translate-x-1']" />
        </button>
      </div>
    </section>

    <p v-if="errors.global" class="text-sm text-red-500">{{ errors.global }}</p>

    <div class="flex items-center gap-3 pt-2 pb-8">
      <Button
        variant="outline"
        class="flex-1"
        :disabled="isSubmitting"
        data-test="btn-draft"
        @click="handleSubmit('DRAFT')"
      >
        Enregistrer brouillon
      </Button>
      <Button
        class="flex-1"
        :disabled="isSubmitting"
        data-test="btn-publish"
        @click="handleSubmit('PUBLISHED')"
      >
        <span v-if="isSubmitting" class="flex items-center gap-2">
          <svg class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Publication…
        </span>
        <span v-else>Publier le trajet</span>
      </Button>
    </div>
  </div>
</template>
