<script setup lang="ts">
import { CreditCard, ArrowRight, ChevronRight } from 'lucide-vue-next'

const steps = ['Choisis ta formule', 'Paiement sécurisé', 'Accède à ton espace']
</script>

<template>
  <section class="border-y border-border bg-surface py-12">
    <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
      <!-- Gauche : explication -->
      <div class="flex items-start gap-4">
        <span
          class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-el border border-border bg-surface-el text-primary"
          aria-hidden="true"
        >
          <CreditCard class="h-5 w-5" :stroke-width="1.75" />
        </span>
        <div>
          <h2 class="mb-1 font-display text-lg font-semibold tracking-[-0.02em] text-text">
            Active ton espace PRO en ligne
          </h2>
          <p class="max-w-md text-sm text-text-muted">
            yadony PRO est l'espace web des voyageurs vérifiés. Abonne-toi directement ici pour débloquer ton accès.
          </p>
        </div>
      </div>

      <!-- Droite : étapes + CTA -->
      <div class="flex flex-shrink-0 flex-col items-center gap-5 sm:flex-row">
        <!-- Étapes en ligne -->
        <div class="flex flex-wrap items-center justify-center gap-2 text-sm">
          <template v-for="(step, i) in steps" :key="step">
            <span class="font-medium text-text">{{ step }}</span>
            <ChevronRight
              v-if="i < steps.length - 1"
              class="h-3 w-3 flex-shrink-0 text-text-subtle"
              :stroke-width="2"
              aria-hidden="true"
            />
          </template>
        </div>
        <!-- Bouton CTA -->
        <NuxtLink
          to="/upgrade"
          class="inline-flex flex-shrink-0 items-center gap-2 rounded-btn bg-primary px-5 py-2.5 font-semibold text-on-primary shadow-btn transition-colors hover:bg-primary-hover"
        >
          <ArrowRight class="h-4 w-4" :stroke-width="1.75" aria-hidden="true" />
          Découvrir les formules PRO
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
