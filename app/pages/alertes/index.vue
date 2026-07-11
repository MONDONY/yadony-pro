<!-- app/pages/alertes/index.vue -->
<script setup lang="ts">
import { onMounted, reactive, computed } from 'vue'
import { BellRing, Trash2, Plus } from 'lucide-vue-next'
import { useCorridorAlerts } from '@/features/alertes/composables/useCorridorAlerts'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Alertes corridor',
  pageSubtitle: 'Sois prévenu dès qu’un colis correspond à tes trajets',
})

const { alerts, isLoading, isMutating, error, fetchAlerts, addAlert, toggle, remove } = useCorridorAlerts()

const form = reactive({
  departureCity: '',
  arrivalCity: '',
  minWeightKg: '' as string | number,
  dateFrom: '',
  dateTo: '',
})

const canSubmit = computed(
  () => form.departureCity.trim().length >= 2 && form.arrivalCity.trim().length >= 2 && !isMutating.value,
)

async function submit() {
  if (!canSubmit.value) return
  await addAlert({
    departureCity: form.departureCity.trim(),
    arrivalCity: form.arrivalCity.trim(),
    minWeightKg: form.minWeightKg === '' ? null : Number(form.minWeightKg),
    dateFrom: form.dateFrom || null,
    dateTo: form.dateTo || null,
  })
  form.departureCity = ''
  form.arrivalCity = ''
  form.minWeightKg = ''
  form.dateFrom = ''
  form.dateTo = ''
}

onMounted(() => {
  fetchAlerts()
})
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <!-- Création -->
    <section class="bg-surface border border-border rounded-card p-5 space-y-4">
      <header>
        <h2 class="font-display font-semibold text-base text-text">Nouvelle alerte</h2>
        <p class="text-sm text-text-muted">Un corridor + des critères : on te notifie dès qu'une demande matche.</p>
      </header>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          v-model="form.departureCity"
          type="text"
          placeholder="Ville de départ (ex. Paris)"
          data-test="alert-departure"
          class="h-10 px-3 rounded-input bg-surface-el border border-border-strong text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors"
        />
        <input
          v-model="form.arrivalCity"
          type="text"
          placeholder="Ville d'arrivée (ex. Dakar)"
          data-test="alert-arrival"
          class="h-10 px-3 rounded-input bg-surface-el border border-border-strong text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors"
        />
        <input
          v-model="form.minWeightKg"
          type="number"
          min="0"
          placeholder="Poids minimum (kg, optionnel)"
          data-test="alert-min-weight"
          class="h-10 px-3 rounded-input bg-surface-el border border-border-strong text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors"
        />
        <div class="flex items-center gap-2">
          <input
            v-model="form.dateFrom"
            type="date"
            data-test="alert-date-from"
            class="flex-1 h-10 px-3 rounded-input bg-surface-el border border-border-strong text-sm text-text focus:outline-none focus:border-primary transition-colors"
          />
          <span class="text-xs text-text-subtle">→</span>
          <input
            v-model="form.dateTo"
            type="date"
            data-test="alert-date-to"
            class="flex-1 h-10 px-3 rounded-input bg-surface-el border border-border-strong text-sm text-text focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>
      <button
        :disabled="!canSubmit"
        data-test="alert-submit"
        class="flex items-center gap-1.5 h-9 px-4 rounded-btn bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        @click="submit"
      >
        <Plus class="w-3.5 h-3.5" /> Créer l'alerte
      </button>
    </section>

    <!-- Liste -->
    <p v-if="error" class="text-sm text-danger" data-test="alerts-error">{{ error }}</p>

    <div v-else-if="isLoading" class="space-y-3" data-test="alerts-loading">
      <div v-for="i in 2" :key="i" class="h-16 bg-surface border border-border rounded-card animate-pulse" />
    </div>

    <div
      v-else-if="alerts.length === 0"
      class="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-card text-center"
      data-test="alerts-empty"
    >
      <BellRing class="w-8 h-8 text-text-subtle mb-2" />
      <p class="text-sm text-text-muted">Aucune alerte. Crée-en une pour recevoir les demandes qui matchent.</p>
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="a in alerts"
        :key="a.id"
        :data-test="`alert-${a.id}`"
        class="flex items-center gap-4 bg-surface border border-border rounded-card px-5 py-4"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-text">{{ a.departureCity }} → {{ a.arrivalCity }}</p>
          <p class="text-xs text-text-muted">
            <template v-if="a.minWeightKg">≥ {{ a.minWeightKg }} kg · </template>
            <NuxtLink to="/demandes" class="text-primary hover:underline">{{ a.matchCount }} demande{{ a.matchCount > 1 ? 's' : '' }} compatible{{ a.matchCount > 1 ? 's' : '' }}</NuxtLink>
          </p>
        </div>
        <button
          :disabled="isMutating"
          :data-test="`alert-toggle-${a.id}`"
          :class="[
            'h-8 px-3 rounded-btn text-xs font-medium border transition-colors disabled:opacity-50',
            a.active ? 'border-success/50 text-success' : 'border-border-strong text-text-subtle',
          ]"
          @click="toggle(a)"
        >
          {{ a.active ? 'Active' : 'En pause' }}
        </button>
        <button
          :disabled="isMutating"
          :data-test="`alert-delete-${a.id}`"
          aria-label="Supprimer l'alerte"
          class="p-2 rounded-btn text-text-subtle hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
          @click="remove(a.id)"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </li>
    </ul>
  </div>
</template>
