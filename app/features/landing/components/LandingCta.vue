<script setup lang="ts">
import { ArrowRight, Lock, ShieldCheck } from 'lucide-vue-next'

const payout = [
  { label: 'Encaissé', value: '5 480,00 €', tone: 'text-text' },
  { label: 'Commission yadony · 12 %', value: '− 657,60 €', tone: 'text-text-muted' },
] as const
</script>

<template>
  <section class="border-t border-border bg-surface-el py-20">
    <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-12 px-6 lg:flex-row">
      <!-- Gauche -->
      <div class="flex max-w-lg flex-col gap-5">
        <h2 class="font-display text-3xl font-semibold leading-snug tracking-[-0.02em] text-text text-balance">
          Prêt à gérer ton activité comme un pro ?
        </h2>
        <p class="text-text-muted">
          Rejoins les voyageurs yadony qui encaissent en sécurité, optimisent leur taux de remplissage et gagnent du temps sur la gestion.
        </p>
        <div class="flex flex-wrap gap-3">
          <NuxtLink
            to="/login"
            class="inline-flex items-center gap-2 rounded-btn bg-primary px-6 py-3 font-semibold text-on-primary shadow-btn transition-colors hover:bg-primary-hover"
          >
            Accéder au cockpit
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </NuxtLink>
        </div>
        <div class="flex items-center gap-2 text-xs text-text-muted">
          <Lock class="h-4 w-4 text-text-subtle" :stroke-width="1.75" aria-hidden="true" />
          <span>Paiements sécurisés via Stripe · Vérification d'identité requise depuis l'app mobile</span>
        </div>
      </div>

      <!-- Droite — preuve produit : reçu de versement Stripe (données mono tabular) -->
      <div class="hidden w-full max-w-sm flex-shrink-0 lg:block" aria-hidden="true">
        <div class="overflow-hidden rounded-card border border-border bg-surface shadow-pop">
          <div class="flex items-center justify-between border-b border-border px-4 py-3">
            <span class="text-sm font-semibold text-text">Versement <span class="text-primary">Stripe</span></span>
            <span class="inline-flex items-center gap-1.5 text-2xs font-medium text-text-muted">
              <span class="h-1.5 w-1.5 rounded-full bg-success" />
              Programmé · 24 mai
            </span>
          </div>

          <div class="flex flex-col gap-3 p-4">
            <div
              v-for="line in payout"
              :key="line.label"
              class="flex items-center justify-between"
            >
              <span class="text-xs text-text-muted">{{ line.label }}</span>
              <span :class="['font-mono text-sm tabular-nums', line.tone]">{{ line.value }}</span>
            </div>
            <div class="flex items-center justify-between border-t border-border pt-3">
              <span class="text-sm font-medium text-text">Net versé</span>
              <span class="font-mono text-lg font-semibold tabular-nums text-text">4 822,40 €</span>
            </div>
          </div>

          <div class="flex items-center gap-2 border-t border-border bg-surface-el px-4 py-2.5">
            <ShieldCheck class="h-4 w-4 text-success" :stroke-width="1.75" aria-hidden="true" />
            <span class="text-2xs text-text-muted">Fonds en séquestre jusqu'à remise confirmée</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
