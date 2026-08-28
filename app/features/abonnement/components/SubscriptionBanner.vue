<!-- app/features/abonnement/components/SubscriptionBanner.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Clock, ChevronRight } from 'lucide-vue-next'
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
  // Math.round est NÉCESSAIRE, pas superflu : les deux dates sont tronquées à
  // minuit LOCAL, donc un changement d'heure (DST) entre les deux jours donne
  // 23h ou 25h d'écart réel. Une division nue produirait 6,96 ou 7,04 au lieu
  // de 7 pile — l'arrondi restaure l'entier de jours calendaires attendu.
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

// "dans 0 jour(s)" est à la fois du jargon (le "(s)") et grammaticalement
// faux en français ("dans 0 jour" ne se dit pas) : on distingue les trois cas
// naturels plutôt que de gabarit-ifier un nombre brut dans la phrase.
const graceEndingLabel = computed(() => {
  const days = graceDaysRemaining.value
  if (days === null) return ''
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'demain'
  return `dans ${days} jours`
})
</script>

<template>
  <!-- Cliquable vers /upgrade : sans cela, un voyageur en grâce historique —
       la cible même de ce bandeau — n'a physiquement aucun moyen de payer
       depuis le portail. -->
  <NuxtLink
    v-if="tone"
    to="/upgrade"
    class="flex items-center gap-3 px-4 py-3 rounded-el border transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:shadow-pop motion-reduce:hover:translate-y-0"
    :class="tone === 'danger' ? 'border-danger/30 bg-danger/5' : 'border-warning/30 bg-warning/5'"
    role="alert"
    data-test="subscription-banner"
  >
    <AlertTriangle v-if="tone === 'danger'" class="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
    <Clock v-else class="h-5 w-5 shrink-0 text-warning" aria-hidden="true" />

    <p v-if="tone === 'danger'" class="flex-1 text-sm text-text">
      Votre dernier paiement a échoué. Mettez à jour votre moyen de paiement pour conserver votre accès Pro.
    </p>
    <p v-else class="flex-1 text-sm text-text">
      Votre accès historique se termine
      <span class="font-semibold" data-test="subscription-banner-days">{{ graceEndingLabel }}</span>. Abonnez-vous pour ne pas perdre votre accès Pro.
    </p>

    <ChevronRight class="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
  </NuxtLink>
</template>
