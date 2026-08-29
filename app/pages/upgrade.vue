<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CheckCircle, Check, ShieldCheck, CreditCard, XCircle, Sparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useSubscription } from '@/features/abonnement/composables/useSubscription'
import { refreshIfPendingActivation } from '@/features/abonnement/lib/refreshIfPendingActivation'
import { PRO_OFFER, PRO_ITEM_ICONS } from '@/features/abonnement/lib/proOffer'
import PricingCard from '@/features/abonnement/components/PricingCard.vue'
import type { BillingCycle } from '@/features/abonnement/types/index'

// `landing` et non `auth` : la page énumère seize fonctions et deux formules. Le panneau
// de connexion de `auth` mange la moitié de l'écran en grand format, ce qui écrasait la
// grille sur une colonne alors qu'il y a la place pour deux.
definePageMeta({ layout: 'landing' })

const route = useRoute()
const auth = useAuthStore()
const { subscription, actionLoading, error, subscribe, fetchSubscription } = useSubscription()

// Retour de Stripe Checkout après paiement réussi (`?success=1`). Le webhook
// Stripe peut ne pas avoir encore atterri côté backend au moment où le
// navigateur revient : sans cet état dédié, un utilisateur qui vient d'être
// débité reverrait la grille tarifaire sans un mot, et recliquer produirait
// un 409 sans issue (boucle fermée avec la page de gestion, cf. pro-only.ts).
const paymentSucceeded = ref(route.query.success === '1')
const isVerifying = ref(false)
const verifyAttempted = ref(false)

/**
 * L'essai est décidé par le backend (`ProTrialPolicy`) : il croise le nombre de trajets
 * réalisés et le passé de client Stripe, deux informations que cette page n'a pas. Elle
 * se contente donc de lire le verdict. Un backend qui n'expose pas encore le champ laisse
 * `trialEligible` à `undefined`, et la page n'annonce simplement rien.
 */
const trialDays = computed(() => {
  const sub = subscription.value
  return sub?.trialEligible && sub.trialDays ? sub.trialDays : null
})

onMounted(async () => {
  const isPendingActivation = await refreshIfPendingActivation(auth, route.query)
  if (isPendingActivation && auth.isProAccount) {
    await navigateTo('/parametres/abonnement')
    return
  }
  // Un visiteur non connecté n'a pas d'abonnement à lire, et l'appel partirait en 401.
  if (auth.isAuthenticated) {
    await fetchSubscription()
  }
})

/** Rejoue le rafraîchissement du profil ; bascule vers la page de gestion dès
 *  que le webhook a fini par atterrir, reste sur l'état d'attente sinon. */
async function onCheckActivation() {
  isVerifying.value = true
  await auth.refreshUser()
  isVerifying.value = false
  verifyAttempted.value = true
  if (auth.isProAccount) {
    await navigateTo('/parametres/abonnement')
  }
}

// On ne peut pas rattacher un paiement à un compte inconnu : un visiteur non
// connecté qui tente de s'abonner est renvoyé se connecter plutôt que de
// déclencher un appel voué à échouer côté backend.
async function onSubscribe(cycle: BillingCycle) {
  if (!auth.isAuthenticated) {
    await navigateTo('/login')
    return
  }

  const url = await subscribe(cycle)
  // Redirection dans l'onglet courant : le parcours se termine par un retour
  // sur le portail, un nouvel onglet laisserait l'utilisateur devant une page
  // périmée (à la différence de la vérification KYC, qui ne revient jamais).
  if (url && import.meta.client) {
    window.location.href = url
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20" data-test="upgrade-page">
    <!-- État d'attente d'activation : volontairement seul à l'écran. Quelqu'un qui vient
         d'être débité n'a qu'une question, et la grille tarifaire sous les yeux la
         rendrait plus inquiétante, pas moins. -->
    <div
      v-if="paymentSucceeded"
      class="mx-auto max-w-lg space-y-6 text-center"
      data-test="upgrade-payment-pending"
    >
      <CheckCircle class="mx-auto h-10 w-10 text-success" aria-hidden="true" />
      <div class="space-y-2">
        <h1 class="font-display text-2xl font-bold text-text" style="text-wrap: balance">Paiement reçu</h1>
        <p class="text-text-muted" style="text-wrap: pretty">
          Ton paiement a bien été enregistré. L'activation de ton espace PRO est en cours et ne devrait prendre
          que quelques instants.
        </p>
      </div>

      <p v-if="verifyAttempted" class="text-sm text-text-muted" data-test="upgrade-still-pending">
        Toujours en cours de traitement. Réessaie dans quelques instants.
      </p>

      <Button :disabled="isVerifying" data-test="upgrade-check-activation-button" @click="onCheckActivation">
        {{ isVerifying ? 'Vérification…' : 'Vérifier à nouveau' }}
      </Button>
    </div>

    <template v-else>
      <header class="stagger mx-auto max-w-2xl text-center" style="--i: 0">
        <span
          v-if="trialDays"
          class="mb-4 inline-flex items-center gap-1.5 rounded-btn bg-success/10 px-3 py-1 text-2xs font-semibold uppercase tracking-wide text-success"
          data-test="upgrade-trial-badge"
        >
          <Sparkles class="h-3 w-3" aria-hidden="true" />
          {{ trialDays }} jours d'essai, sans engagement
        </span>

        <h1 class="font-display text-3xl font-bold text-text sm:text-4xl" style="text-wrap: balance">
          Ton activité de voyageur, pilotée depuis un vrai bureau
        </h1>
        <p class="mt-3 text-text-muted" style="text-wrap: pretty">
          L'application suffit pour transporter. Le portail PRO sert à en vivre&nbsp;: publier plus vite,
          fixer tes prix, automatiser ce qui se répète et suivre chaque colis jusqu'à la remise.
        </p>
      </header>

      <p v-if="error" class="stagger mt-6 text-center text-sm text-danger" style="--i: 1" data-test="upgrade-error">
        {{ error }}
      </p>

      <div class="stagger mt-10 grid gap-4 text-left sm:grid-cols-2" style="--i: 1" data-test="upgrade-pricing">
        <PricingCard cycle="MONTHLY" :trial-days="trialDays" :is-loading="actionLoading" @subscribe="onSubscribe" />
        <PricingCard cycle="YEARLY" featured :trial-days="trialDays" :is-loading="actionLoading" @subscribe="onSubscribe" />
      </div>

      <p
        v-if="trialDays"
        class="stagger mt-4 text-center text-sm text-text-muted"
        style="--i: 2"
        data-test="upgrade-trial-note"
      >
        Rien n'est prélevé pendant les {{ trialDays }} premiers jours. Résilie avant la fin de l'essai et tu ne
        paies rien.
      </p>
      <p
        v-else
        class="stagger mt-4 text-center text-sm text-text-muted"
        style="--i: 2"
        data-test="upgrade-no-trial-note"
      >
        L'essai gratuit est réservé aux voyageurs ayant déjà réalisé un trajet avec l'application. Tu peux
        t'abonner dès maintenant et résilier à tout moment.
      </p>

      <section class="stagger mt-16" style="--i: 3" aria-labelledby="offre-pro" data-test="upgrade-offer">
        <h2 id="offre-pro" class="font-display text-center text-xl font-semibold text-text" style="text-wrap: balance">
          Ce que l'abonnement ouvre
        </h2>

        <div class="mt-8 grid gap-4 sm:grid-cols-2">
          <article
            v-for="group in PRO_OFFER"
            :key="group.key"
            class="rounded-card border border-border bg-surface p-5"
            data-test="offer-group"
          >
            <div class="flex items-start gap-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-btn bg-primary/10 text-primary">
                <component :is="group.icon" class="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div>
                <h3 class="font-display font-semibold text-text">{{ group.title }}</h3>
                <p class="mt-0.5 text-sm text-text-muted" style="text-wrap: pretty">{{ group.summary }}</p>
              </div>
            </div>

            <ul class="mt-4 space-y-2.5">
              <li v-for="item in group.items" :key="item.label" class="flex items-start gap-2.5">
                <component
                  :is="PRO_ITEM_ICONS[item.label] ?? Check"
                  class="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span class="text-sm leading-snug">
                  <span class="font-medium text-text">{{ item.label }}</span>
                  <span class="text-text-muted"> — {{ item.detail }}</span>
                </span>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <ul
        class="stagger mt-12 grid gap-3 text-sm text-text-muted sm:grid-cols-3"
        style="--i: 4"
        data-test="upgrade-reassurance"
      >
        <li class="flex items-center gap-2.5 rounded-card border border-border bg-surface-el px-4 py-3">
          <XCircle class="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          Résiliable à tout moment, depuis tes paramètres
        </li>
        <li class="flex items-center gap-2.5 rounded-card border border-border bg-surface-el px-4 py-3">
          <CreditCard class="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          Paiement par Stripe, ta carte ne transite pas par yadony
        </li>
        <li class="flex items-center gap-2.5 rounded-card border border-border bg-surface-el px-4 py-3">
          <ShieldCheck class="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          Tes trajets et tes colis restent accessibles sans PRO
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
/*
 * Entrée échelonnée : chaque bloc sémantique glisse à ~90 ms d'écart, ce qui donne un
 * ordre de lecture au lieu d'un bloc qui apparaît d'un coup. `--i` porte le rang.
 */
.stagger {
  animation: rise 420ms cubic-bezier(0.2, 0, 0, 1) backwards;
  animation-delay: calc(var(--i, 0) * 90ms);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

/* Une animation d'entrée n'est jamais assez utile pour être imposée. */
@media (prefers-reduced-motion: reduce) {
  .stagger {
    animation: none;
  }
}
</style>
