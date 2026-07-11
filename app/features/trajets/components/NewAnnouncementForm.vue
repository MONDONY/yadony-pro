<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronDown, LayoutTemplate, BookmarkPlus, X } from 'lucide-vue-next'
import { useAnnouncementForm } from '@/features/trajets/composables/useAnnouncementForm'
import { extractProblem } from '@/lib/apiError'
import { useTrips } from '@/features/trajets/composables/useTrips'
import { configService } from '@/features/trajets/services/configService'
import { tripTemplateService } from '@/features/trajets/services/tripTemplateService'
import type { UserTripTemplate } from '@/features/trajets/types/index'
import GooglePlacesInput from '@/features/trajets/components/GooglePlacesInput.vue'
import TransportModeChips from '@/features/trajets/components/TransportModeChips.vue'
import WeightSlider from '@/features/trajets/components/WeightSlider.vue'
import CapacitySelector from '@/features/trajets/components/CapacitySelector.vue'
import PriceOptionCards from '@/features/trajets/components/PriceOptionCards.vue'
import ContentTagChips from '@/features/trajets/components/ContentTagChips.vue'
import { Button } from '@/components/ui/button'
import { TRIP_TEMPLATES, type TripTemplate } from '@/features/trajets/data/tripTemplates'
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

const { form, netPrice, commissionRate, validate, submit, submitEdit, applyTemplate, applyQuickTemplate, buildTemplatePayload } = useAnnouncementForm()
const { fetchTemplates } = useTrips()
const { fetchContentCategories } = configService()
const tplSvc = tripTemplateService()

const errors = ref<ValidationErrors>({})
const isSubmitting = ref(false)
const quickTemplates = TRIP_TEMPLATES
const selectedQuickTemplateId = ref<string | null>(null)
const myTemplates = ref<UserTripTemplate[]>([])
const selectedMyTemplateId = ref<string | null>(null)
const isSavingTemplate = ref(false)
const showSaveTemplate = ref(false)
const newTemplateLabel = ref('')
const templates = ref<Trip[]>([])
const showTemplates = ref(false)
const selectedTemplateId = ref<string | null>(null)
const acceptedPresets = ref<string[]>([])

const submitErrorMessages: Record<string, string> = {
  'draft-limit-reached': 'Limite de brouillons atteinte. Passez en PRO pour en créer davantage.',
  'pro-limit-reached': 'Limite mensuelle d’annonces atteinte. Passez en PRO pour publier davantage.',
  'kyc-not-verified': 'Vérifiez votre identité (KYC) dans les paramètres avant de publier un trajet.',
  'publishing-suspended': 'La publication est suspendue sur votre compte. Contactez le support.',
  'departure-date-passed': 'La date de départ est passée. Corrigez-la avant de publier.',
}

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
  const [fetchedTemplates, fetchedCategories, fetchedMyTemplates] = await Promise.all([
    fetchTemplates(),
    fetchContentCategories(),
    tplSvc.list().catch(() => [] as UserTripTemplate[]),
  ])
  templates.value = fetchedTemplates
  acceptedPresets.value = fetchedCategories
  myTemplates.value = fetchedMyTemplates
  if (props.prefill) {
    applyTemplate(props.prefill)
  }
})

function onSelectTemplate(trip: Trip) {
  applyTemplate(trip)
  selectedTemplateId.value = trip.id
  showTemplates.value = false
}

function onSelectQuickTemplate(t: TripTemplate) {
  applyQuickTemplate(t)
  selectedQuickTemplateId.value = t.id
}

function onSelectMyTemplate(t: UserTripTemplate) {
  applyQuickTemplate(t)
  selectedMyTemplateId.value = t.id
}

async function onDeleteMyTemplate(t: UserTripTemplate) {
  myTemplates.value = myTemplates.value.filter((x) => x.id !== t.id)
  if (selectedMyTemplateId.value === t.id) selectedMyTemplateId.value = null
  try {
    await tplSvc.remove(t.id)
  } catch {
    myTemplates.value = [...myTemplates.value, t]
  }
}

const canSaveTemplate = computed(() => !!form.departureCity && !!form.arrivalCity)

async function onSaveTemplate() {
  const label = newTemplateLabel.value.trim()
  if (!label || !canSaveTemplate.value) return
  isSavingTemplate.value = true
  try {
    const created = await tplSvc.create(buildTemplatePayload(label))
    myTemplates.value = [created, ...myTemplates.value]
    newTemplateLabel.value = ''
    showSaveTemplate.value = false
  } catch {
    errors.value.global = "Impossible d'enregistrer le modèle."
  } finally {
    isSavingTemplate.value = false
  }
}

async function handleSubmit(status: 'DRAFT' | 'PUBLISHED') {
  const validationErrors = validate()
  errors.value = validationErrors
  if (Object.keys(validationErrors).length > 0) return

  isSubmitting.value = true
  try {
    const trip = props.editTripId
      ? await submitEdit(props.editTripId, status)
      : await submit(status)
    emit('submitted', trip)
  } catch (e) {
    const { code, detail } = extractProblem(e)
    errors.value.global =
      (code && submitErrorMessages[code]) || detail || 'Une erreur est survenue. Réessayez.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl space-y-8">

    <!-- Mes modèles (configurables, synchronisés via le backend) -->
    <div v-if="!editTripId" class="bg-surface border border-border rounded-card p-4" data-test="my-templates">
      <div class="flex items-center justify-between mb-3">
        <p class="flex items-center gap-2 text-sm font-medium text-text">
          <LayoutTemplate class="w-4 h-4 text-primary" />
          Mes modèles
          <span class="text-xs font-normal text-text-muted">— tes trajets enregistrés</span>
        </p>
        <button
          type="button"
          data-test="open-save-template"
          class="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!canSaveTemplate"
          @click="showSaveTemplate = !showSaveTemplate"
        >
          <BookmarkPlus class="w-3.5 h-3.5" />
          Enregistrer ce trajet
        </button>
      </div>

      <div v-if="myTemplates.length > 0" class="flex flex-wrap gap-2">
        <div
          v-for="t in myTemplates"
          :key="t.id"
          :data-test="`my-template-${t.id}`"
          :class="[
            'group flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full border text-sm transition-colors',
            selectedMyTemplateId === t.id
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:border-primary/50 text-text-muted hover:text-text',
          ]"
        >
          <button type="button" class="flex items-center gap-1" @click="onSelectMyTemplate(t)">
            <span v-if="t.emoji">{{ t.emoji }}</span>
            {{ t.label }} · {{ t.pricePerKg }}€/kg
          </button>
          <button
            type="button"
            :data-test="`delete-my-template-${t.id}`"
            class="ml-0.5 rounded-full p-0.5 text-text-muted hover:text-danger hover:bg-danger/10"
            :aria-label="`Supprimer le modèle ${t.label}`"
            @click.stop="onDeleteMyTemplate(t)"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p v-else class="text-xs text-text-muted" data-test="my-templates-empty">
        Aucun modèle enregistré. Remplis un trajet puis « Enregistrer ce trajet » pour le réutiliser.
      </p>

      <!-- Formulaire d'enregistrement -->
      <div v-if="showSaveTemplate" class="mt-3 flex items-center gap-2" data-test="save-template-form">
        <input
          v-model="newTemplateLabel"
          type="text"
          maxlength="60"
          placeholder="Nom du modèle (ex. Mon Paris → Dakar)"
          data-test="save-template-label"
          class="flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none"
          @keyup.enter="onSaveTemplate"
        >
        <Button
          type="button"
          size="sm"
          data-test="save-template-submit"
          :disabled="!newTemplateLabel.trim() || isSavingTemplate"
          @click="onSaveTemplate"
        >
          {{ isSavingTemplate ? '…' : 'Enregistrer' }}
        </Button>
      </div>
    </div>

    <!-- Suggestions de corridors prédéfinis -->
    <div v-if="!editTripId" class="bg-surface border border-border rounded-card p-4" data-test="quick-templates">
      <p class="flex items-center gap-2 text-sm font-medium text-text mb-3">
        <LayoutTemplate class="w-4 h-4 text-primary" />
        Suggestions
        <span class="text-xs font-normal text-text-muted">— corridors courants pré-remplis</span>
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="t in quickTemplates"
          :key="t.id"
          type="button"
          :data-test="`quick-template-${t.id}`"
          :class="[
            'px-3 py-1.5 rounded-full border text-sm transition-colors',
            selectedQuickTemplateId === t.id
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:border-primary/50 text-text-muted hover:text-text',
          ]"
          @click="onSelectQuickTemplate(t)"
        >
          {{ t.emoji }} {{ t.label }} · {{ t.pricePerKg }}€/kg
        </button>
      </div>
      <p v-if="selectedQuickTemplateId" class="text-xs text-text-muted mt-2" data-test="quick-template-hint">
        Modèle appliqué. Complète la date et les lieux de remise / récupération, puis publie.
      </p>
    </div>

    <!-- Template picker -->
    <div v-if="templates.length > 0" class="rounded-el border border-border bg-surface p-4 shadow-card">
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
          <span class="ml-2 text-xs">· <span class="font-mono tabular-nums">{{ t.pricePerKg }}€/kg</span> · <span class="font-mono tabular-nums">{{ t.availableWeightKg }} kg</span></span>
        </button>
      </div>
    </div>

    <!-- Section Trajet -->
    <section class="space-y-5">
      <h2 class="font-display text-lg font-semibold text-text border-b border-border pb-2">Trajet</h2>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-text mb-1.5">
            Ville de départ <span class="text-danger">*</span>
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
            class="flex h-10 w-full rounded-input border border-border-strong bg-surface px-3 py-1 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-[border-color,box-shadow]"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-text mb-1.5">
            Ville d'arrivée <span class="text-danger">*</span>
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
            class="flex h-10 w-full rounded-input border border-border-strong bg-surface px-3 py-1 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-[border-color,box-shadow]"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-text mb-1.5">
          Date de départ <span class="text-danger">*</span>
        </label>
        <input
          v-model="form.departureDate"
          type="date"
          :min="minDate"
          :max="maxDate"
          :class="[
            'flex h-10 w-full rounded-input border bg-surface px-3 py-1 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-[border-color,box-shadow]',
            errors.departureDate ? 'border-danger' : 'border-border-strong',
          ]"
        />
        <p v-if="errors.departureDate" class="mt-1 text-xs text-danger">{{ errors.departureDate }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-text mb-1.5">
          Mode de transport <span class="text-danger">*</span>
        </label>
        <TransportModeChips v-model="form.transportMode" :error="errors.transportMode" />
      </div>
    </section>

    <!-- Section Lieux de remise -->
    <section class="space-y-5">
      <h2 class="font-display text-lg font-semibold text-text border-b border-border pb-2">Lieux de remise</h2>
      <div>
        <label class="block text-sm font-medium text-text mb-1.5">
          Lieu de remise du colis <span class="text-danger">*</span>
        </label>
        <GooglePlacesInput
          v-model="form.pickupPlace"
          placeholder="Ex : 12 rue de la Paix, Paris"
          :error="errors.pickupPlace"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-text mb-1.5">
          Lieu de récupération <span class="text-danger">*</span>
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
      <h2 class="font-display text-lg font-semibold text-text border-b border-border pb-2">Capacité & Prix</h2>
      <CapacitySelector v-model="form.capacityUnit" />
      <WeightSlider v-model="form.availableWeightKg" :min="1" :max="23" />
      <div>
        <label class="block text-sm font-medium text-text mb-3">
          Prix par kg <span class="text-danger">*</span>
        </label>
        <PriceOptionCards v-model="form.pricePerKg" :commission-rate="commissionRate" />
        <p class="mt-2 text-xs text-text-muted">
          Commission dony (12%) déduite · Vous recevez
          <span class="font-mono tabular-nums text-text font-medium">{{ netPrice.toFixed(2) }}€/kg</span>
        </p>
      </div>
    </section>

    <!-- Section Contenu -->
    <section class="space-y-5">
      <h2 class="font-display text-lg font-semibold text-text border-b border-border pb-2">Contenu accepté</h2>
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
      <h2 class="font-display text-lg font-semibold text-text border-b border-border pb-2">Note & Paiement</h2>
      <div>
        <label class="block text-sm font-medium text-text mb-1.5">Note aux expéditeurs</label>
        <textarea
          v-model="form.senderNote"
          :maxlength="500"
          rows="4"
          placeholder="Informations complémentaires pour les expéditeurs…"
          class="w-full rounded-input border border-border-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 resize-none transition-[border-color,box-shadow]"
        />
        <p class="mt-1 text-xs text-text-muted text-right"><span class="font-mono tabular-nums">{{ form.senderNote.length }}</span>/500</p>
      </div>

      <div class="flex items-center justify-between p-4 rounded-el border border-border bg-surface-el">
        <div>
          <p class="text-sm font-medium text-text">Paiement en espèces</p>
          <p class="text-xs text-text-muted mt-0.5">La carte bancaire Stripe est toujours activée</p>
        </div>
        <button
          type="button"
          :class="['relative w-10 h-6 rounded-full transition-colors', form.cashAccepted ? 'bg-primary' : 'bg-border-strong']"
          :aria-pressed="form.cashAccepted"
          data-test="cash-toggle"
          @click="form.cashAccepted = !form.cashAccepted"
        >
          <span :class="['absolute top-1 w-4 h-4 bg-surface rounded-full shadow transition-transform', form.cashAccepted ? 'translate-x-5' : 'translate-x-1']" />
        </button>
      </div>
    </section>

    <p v-if="errors.global" class="text-sm text-danger">{{ errors.global }}</p>

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
