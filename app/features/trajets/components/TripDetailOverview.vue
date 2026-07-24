<!-- app/features/trajets/components/TripDetailOverview.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { MapPin, Calendar, Clock, Package, CreditCard, FileText } from 'lucide-vue-next'
import { SectionLabel } from '@/components/ui/section-label'
import type { Trip } from '@/features/trajets/types/index'

const props = defineProps<{
  trip: Trip
}>()

const formattedDate = computed(() =>
  new Date(props.trip.departureDate).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
)

const fillPct = computed(() =>
  props.trip.availableWeightKg > 0
    ? Math.round((props.trip.usedWeightKg / props.trip.availableWeightKg) * 100)
    : 0
)

const barColor = computed(() =>
  fillPct.value >= 80 ? 'bg-success' : fillPct.value >= 40 ? 'bg-warning' : 'bg-danger'
)

const paymentMethods = computed(() => {
  const methods: string[] = []
  if (props.trip.cashAccepted) methods.push('Espèces')
  methods.push('Carte (Stripe)')
  return methods
})

const capacityUnitLabel = computed(() => {
  const labels: Record<string, string> = {
    SUITCASE_23KG: '1 valise 23 kg',
    SUITCASE_32KG: '1 valise 32 kg',
    KG_FREE: 'Kg libre',
  }
  return labels[props.trip.capacityUnit ?? ''] ?? ''
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

    <!-- Trajet info -->
    <section class="rounded-el border border-border bg-surface p-5 shadow-card space-y-4">
      <SectionLabel as="h2">Trajet</SectionLabel>

      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <Calendar class="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p class="text-xs text-text-muted">Date de départ</p>
            <p class="text-sm text-text font-medium capitalize">{{ formattedDate }}</p>
          </div>
        </div>

        <div v-if="trip.departureTime" class="flex items-start gap-3">
          <Clock class="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p class="text-xs text-text-muted">Horaires</p>
            <p class="text-sm text-text font-medium">
              {{ trip.departureTime }}
              <template v-if="trip.arrivalTime"> → {{ trip.arrivalTime }}</template>
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <MapPin class="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p class="text-xs text-text-muted">Lieu de remise</p>
            <p class="text-sm text-text font-medium">{{ trip.pickupPlace.label }}</p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <MapPin class="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p class="text-xs text-text-muted">Lieu de récupération</p>
            <p class="text-sm text-text font-medium">{{ trip.dropoffPlace.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Capacité -->
    <section class="rounded-el border border-border bg-surface p-5 shadow-card space-y-4">
      <SectionLabel as="h2">Capacité</SectionLabel>

      <div class="space-y-3">
        <div class="space-y-1.5">
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Utilisé</span>
            <span class="font-mono tabular-nums text-text font-medium">{{ trip.usedWeightKg }} / {{ trip.availableWeightKg }} kg</span>
          </div>
          <div class="h-2 w-full bg-surface-el rounded-full overflow-hidden">
            <div
              :class="['h-full rounded-full transition-all', barColor]"
              :style="{ width: fillPct + '%' }"
            />
          </div>
          <p class="text-xs text-text-muted text-right"><span class="font-mono tabular-nums">{{ fillPct }}%</span> rempli</p>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-1">
          <div class="bg-surface-el rounded-el px-3 py-2 text-center">
            <p class="font-mono text-lg font-semibold tabular-nums text-text">{{ trip.confirmedParcelCount }}</p>
            <p class="text-xs text-text-subtle">Colis confirmés</p>
          </div>
          <div class="bg-surface-el rounded-el px-3 py-2 text-center">
            <p class="font-mono text-lg font-semibold tabular-nums text-warning">{{ trip.pendingBidCount }}</p>
            <p class="text-xs text-text-subtle">Colis en attente</p>
          </div>
        </div>

        <div class="flex items-start gap-3 pt-1">
          <Package class="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p class="text-xs text-text-muted">Prix</p>
            <p class="font-mono text-sm font-semibold tabular-nums text-text">{{ trip.pricePerKg }} €/kg</p>
          </div>
        </div>

        <div v-if="capacityUnitLabel" class="flex items-center gap-1.5 text-sm text-text-muted">
          <span class="font-medium text-text">{{ capacityUnitLabel }}</span>
        </div>
      </div>
    </section>

    <!-- Contenu accepté/refusé -->
    <section class="rounded-el border border-border bg-surface p-5 shadow-card space-y-3">
      <SectionLabel as="h2">Contenu</SectionLabel>

      <div v-if="trip.acceptedCategories.length > 0">
        <p class="text-xs text-text-muted mb-1.5">Accepté</p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="cat in trip.acceptedCategories"
            :key="cat"
            class="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success"
          >{{ cat }}</span>
        </div>
      </div>

      <div v-if="trip.refusedCategories.length > 0">
        <p class="text-xs text-text-muted mb-1.5">Refusé</p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="cat in trip.refusedCategories"
            :key="cat"
            class="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger"
          >{{ cat }}</span>
        </div>
      </div>

      <p v-if="trip.acceptedCategories.length === 0 && trip.refusedCategories.length === 0" class="text-sm text-text-muted">
        Aucune restriction de contenu.
      </p>
    </section>

    <!-- Paiement + notes -->
    <section class="rounded-el border border-border bg-surface p-5 shadow-card space-y-4">
      <SectionLabel as="h2">Paiement & notes</SectionLabel>

      <div class="flex items-start gap-3">
        <CreditCard class="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p class="text-xs text-text-muted">Méthodes acceptées</p>
          <p class="text-sm text-text font-medium">{{ paymentMethods.join(', ') }}</p>
        </div>
      </div>

      <div v-if="trip.senderNote" class="flex items-start gap-3">
        <FileText class="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p class="text-xs text-text-muted">Note pour les expéditeurs</p>
          <p class="text-sm text-text">{{ trip.senderNote }}</p>
        </div>
      </div>
    </section>

  </div>
</template>
