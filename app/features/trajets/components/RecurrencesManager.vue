<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Repeat, Plus, Trash2 } from 'lucide-vue-next'
import { tripRecurrenceService, recurrenceToPayload } from '@/features/trajets/services/tripRecurrenceService'
import { tripTemplateService } from '@/features/trajets/services/tripTemplateService'
import GooglePlacesInput from '@/features/trajets/components/GooglePlacesInput.vue'
import { Button } from '@/components/ui/button'
import type { SelectedPlace, UserTripRecurrence, UserTripTemplate } from '@/features/trajets/types/index'

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const WEEKDAY_FULL = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const recSvc = tripRecurrenceService()
const tplSvc = tripTemplateService()

const recurrences = ref<UserTripRecurrence[]>([])
const templates = ref<UserTripTemplate[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const showCreate = ref(false)
const selectedTemplateId = ref<string | null>(null)
const days = ref<boolean[]>([false, false, false, false, false, false, false])
const time = ref('')
const pickupPlace = ref<SelectedPlace | null>(null)
const dropoffPlace = ref<SelectedPlace | null>(null)
const isSaving = ref(false)

const selectedTemplate = computed(() =>
  templates.value.find((t) => t.id === selectedTemplateId.value) ?? null,
)

const canCreate = computed(
  () => !!selectedTemplate.value && days.value.some(Boolean) && !!pickupPlace.value && !!dropoffPlace.value,
)

onMounted(async () => {
  try {
    const [recs, tpls] = await Promise.all([recSvc.list(), tplSvc.list()])
    recurrences.value = recs
    templates.value = tpls
  } catch {
    error.value = 'Impossible de charger les récurrences.'
  } finally {
    loading.value = false
  }
})

function weekdaysSummary(weekdays: string): string {
  const sel = WEEKDAY_FULL.filter((_, i) => weekdays[i] === '1')
  return sel.length === 7 ? 'Tous les jours' : sel.join(', ')
}

function resetForm() {
  selectedTemplateId.value = null
  days.value = [false, false, false, false, false, false, false]
  time.value = ''
  pickupPlace.value = null
  dropoffPlace.value = null
}

async function onCreate() {
  const tpl = selectedTemplate.value
  if (!tpl || !canCreate.value) return
  isSaving.value = true
  try {
    const created = await recSvc.create({
      sourceTemplateId: tpl.id,
      departureCity: tpl.departureCity.label,
      arrivalCity: tpl.arrivalCity.label,
      transportMode: tpl.transportMode,
      capacityUnit: tpl.capacityUnit,
      availableKg: tpl.availableWeightKg,
      pricePerKg: tpl.pricePerKg,
      acceptedCategories: [...tpl.acceptedCategories],
      pickupAddress: { label: pickupPlace.value!.label, lat: pickupPlace.value!.lat, lng: pickupPlace.value!.lng },
      deliveryAddress: { label: dropoffPlace.value!.label, lat: dropoffPlace.value!.lat, lng: dropoffPlace.value!.lng },
      departureTime: time.value || null,
      arrivalTime: tpl.arrivalTime,
      cashAccepted: tpl.cashAccepted,
      weekdays: days.value.map((d) => (d ? '1' : '0')).join(''),
      horizonDays: 14,
      active: true,
    })
    recurrences.value = [created, ...recurrences.value]
    showCreate.value = false
    resetForm()
  } catch {
    error.value = "Impossible de créer la récurrence."
  } finally {
    isSaving.value = false
  }
}

async function toggleActive(rec: UserTripRecurrence) {
  const previous = rec.active
  rec.active = !rec.active
  try {
    await recSvc.update(rec.id, { ...recurrenceToPayload(rec) })
  } catch {
    rec.active = previous
    error.value = 'Impossible de mettre à jour la récurrence.'
  }
}

async function onDelete(rec: UserTripRecurrence) {
  const backup = recurrences.value
  recurrences.value = recurrences.value.filter((r) => r.id !== rec.id)
  try {
    await recSvc.remove(rec.id)
  } catch {
    recurrences.value = backup
    error.value = 'Impossible de supprimer la récurrence.'
  }
}
</script>

<template>
  <div class="max-w-3xl space-y-6" data-test="recurrences-manager">
    <p v-if="error" class="text-sm text-danger" data-test="recurrences-error">{{ error }}</p>

    <!-- En-tête + créer -->
    <div class="flex items-center justify-between">
      <p class="flex items-center gap-2 text-sm text-text-muted">
        <Repeat class="w-4 h-4 text-primary" />
        Publie automatiquement tes trajets selon un planning hebdomadaire.
      </p>
      <Button
        v-if="templates.length > 0"
        type="button"
        size="sm"
        data-test="open-create-recurrence"
        @click="showCreate = !showCreate"
      >
        <Plus class="w-4 h-4 mr-1" /> Nouvelle récurrence
      </Button>
    </div>

    <p v-if="!loading && templates.length === 0" class="text-sm text-text-muted" data-test="recurrences-no-template">
      Crée d'abord un modèle de trajet (dans « Nouvelle annonce ») pour pouvoir programmer une récurrence.
    </p>

    <!-- Formulaire de création -->
    <div v-if="showCreate" class="bg-surface border border-border rounded-card p-4 space-y-4" data-test="create-recurrence-form">
      <div>
        <label class="block text-sm font-medium text-text mb-1">Modèle</label>
        <select
          v-model="selectedTemplateId"
          data-test="recurrence-template-select"
          class="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
        >
          <option :value="null" disabled>Choisir un modèle…</option>
          <option v-for="t in templates" :key="t.id" :value="t.id">
            {{ t.emoji ? t.emoji + ' ' : '' }}{{ t.label }} · {{ t.pricePerKg }}€/kg
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-text mb-2">Jours de répétition</label>
        <div class="flex gap-2">
          <button
            v-for="(label, i) in WEEKDAY_LABELS"
            :key="i"
            type="button"
            :data-test="`recurrence-day-${i}`"
            :class="[
              'w-9 h-9 rounded-full border text-sm font-semibold transition-colors',
              days[i] ? 'border-primary bg-primary text-white' : 'border-border text-text-muted hover:border-primary/50',
            ]"
            @click="days[i] = !days[i]"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-text mb-1">Heure de départ (optionnel)</label>
        <input
          v-model="time"
          type="time"
          data-test="recurrence-time"
          class="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-text mb-1">Lieu de remise</label>
        <GooglePlacesInput v-model="pickupPlace" placeholder="Ex : 12 rue de la Paix, Paris" />
      </div>
      <div>
        <label class="block text-sm font-medium text-text mb-1">Lieu de récupération</label>
        <GooglePlacesInput v-model="dropoffPlace" placeholder="Ex : Aéroport de Dakar" />
      </div>

      <div class="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" @click="showCreate = false; resetForm()">Annuler</Button>
        <Button
          type="button"
          size="sm"
          data-test="submit-recurrence"
          :disabled="!canCreate || isSaving"
          @click="onCreate"
        >
          {{ isSaving ? '…' : 'Activer la récurrence' }}
        </Button>
      </div>
    </div>

    <!-- Liste -->
    <div v-if="loading" class="text-sm text-text-muted">Chargement…</div>
    <p v-else-if="recurrences.length === 0 && templates.length > 0" class="text-sm text-text-muted" data-test="recurrences-empty">
      Aucune récurrence. Clique sur « Nouvelle récurrence » pour en programmer une.
    </p>
    <div v-else class="space-y-3">
      <div
        v-for="rec in recurrences"
        :key="rec.id"
        :data-test="`recurrence-${rec.id}`"
        class="bg-surface border border-border rounded-card p-4 flex items-center gap-4"
      >
        <div class="flex-1">
          <p class="text-sm font-semibold text-text">
            {{ rec.departureCity }} → {{ rec.arrivalCity }} · {{ rec.pricePerKg }}€/kg
          </p>
          <p class="text-xs text-text-muted mt-0.5">
            🔁 {{ weekdaysSummary(rec.weekdays) }}{{ rec.departureTime ? ' · ' + rec.departureTime : '' }}
          </p>
        </div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            :checked="rec.active"
            :data-test="`recurrence-toggle-${rec.id}`"
            class="accent-primary"
            @change="toggleActive(rec)"
          >
          <span class="text-xs" :class="rec.active ? 'text-success' : 'text-text-muted'">
            {{ rec.active ? 'Active' : 'En pause' }}
          </span>
        </label>
        <button
          type="button"
          :data-test="`recurrence-delete-${rec.id}`"
          class="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10"
          :aria-label="`Supprimer la récurrence ${rec.departureCity} ${rec.arrivalCity}`"
          @click="onDelete(rec)"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
