<!-- app/features/abonnement/components/SubscriptionBanner.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Clock } from 'lucide-vue-next'
import type { ProSubscription } from '@/features/abonnement/types/index'

const props = defineProps<{
  subscription: ProSubscription | null
}>()

const DAY_MS = 24 * 60 * 60 * 1000

// Différence exprimée en jours calendaires (et non en heures écoulées), pour
// que "il reste N jours" ne dépende jamais de l'heure à laquelle la page est
// ouverte ni du temps de rendu du composant.
function calendarDaysUntil(iso: string): number {
  const target = new Date(iso)
  const now = new Date()
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((startOfTarget.getTime() - startOfNow.getTime()) / DAY_MS)
}

const isPastDue = computed(() => props.subscription?.status === 'PAST_DUE')

const graceDaysRemaining = computed(() => {
  const graceExpiresAt = props.subscription?.graceExpiresAt
  if (props.subscription?.status !== 'LEGACY_GRACE' || !graceExpiresAt) return null
  return calendarDaysUntil(graceExpiresAt)
})

// Alerte dès qu'il reste 7 jours ou moins avant la fin de la grâce historique.
const isGraceEndingSoon = computed(
  () => graceDaysRemaining.value !== null && graceDaysRemaining.value >= 0 && graceDaysRemaining.value <= 7,
)

const tone = computed<'danger' | 'warning' | null>(() => {
  if (isPastDue.value) return 'danger'
  if (isGraceEndingSoon.value) return 'warning'
  return null
})
</script>

<template>
  <div
    v-if="tone"
    class="flex items-center gap-3 px-4 py-3 rounded-el border"
    :class="tone === 'danger' ? 'border-danger/30 bg-danger/5' : 'border-warning/30 bg-warning/5'"
    role="alert"
    data-test="subscription-banner"
  >
    <AlertTriangle v-if="tone === 'danger'" class="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
    <Clock v-else class="h-5 w-5 shrink-0 text-warning" aria-hidden="true" />

    <p v-if="tone === 'danger'" class="text-sm text-text">
      Votre dernier paiement a échoué. Mettez à jour votre moyen de paiement pour conserver votre accès Pro.
    </p>
    <p v-else class="text-sm text-text">
      Votre accès historique se termine dans
      <span class="font-mono tabular-nums font-semibold" data-test="subscription-banner-days">{{ graceDaysRemaining }}</span>
      jour(s). Abonnez-vous pour ne pas perdre votre accès Pro.
    </p>
  </div>
</template>
