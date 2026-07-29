<script setup lang="ts">
import { Star, Quote } from 'lucide-vue-next'

const testimonials = [
  {
    quote: "Avant, je gérais tout par WhatsApp. Maintenant j'ai une vue claire sur mes trajets, mes paiements et mes colis. Le cockpit m'a changé la vie.",
    name: 'Amadou D.',
    initials: 'AD',
    role: 'Voyageur Paris → Dakar · 3 ans',
  },
  {
    quote: "Le paiement en séquestre m'a convaincue. J'avais peur de ne pas être payée après la livraison. Maintenant tout est sécurisé, je n'ai plus d'inquiétude.",
    name: 'Fatoumata K.',
    initials: 'FK',
    role: 'Voyageuse Lyon → Abidjan · 2 ans',
  },
  {
    quote: "La fonctionnalité de matching est incroyable. Je reçois des demandes d'expéditeurs vérifiés directement, sans chercher. Mon taux de remplissage a explosé.",
    name: 'Moussa C.',
    initials: 'MC',
    role: 'Voyageur Marseille → Bamako · 4 ans',
  },
]
</script>

<template>
  <section class="bg-surface-el py-20">
    <div class="mx-auto max-w-6xl px-6">
      <div class="mb-12 text-center">
        <h2 class="font-display text-3xl font-semibold tracking-[-0.02em] text-text">Ce qu'en disent les voyageurs</h2>
        <p class="mt-3 text-text-muted">Ils gèrent leur activité depuis Yadony PRO.</p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <figure
          v-for="t in testimonials"
          :key="t.name"
          class="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-card"
        >
          <!-- Note -->
          <div class="flex gap-0.5" aria-label="5 étoiles sur 5">
            <Star
              v-for="i in 5"
              :key="i"
              class="h-4 w-4 fill-warning text-warning"
              :stroke-width="1.75"
              aria-hidden="true"
            />
          </div>

          <!-- Citation -->
          <blockquote class="flex flex-1 flex-col gap-3">
            <Quote class="h-5 w-5 text-primary/40" :stroke-width="1.75" aria-hidden="true" />
            <p class="text-sm leading-relaxed text-text">{{ t.quote }}</p>
          </blockquote>

          <!-- Auteur -->
          <figcaption class="flex items-center gap-3 border-t border-border pt-4">
            <div
              class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              aria-hidden="true"
            >{{ t.initials }}</div>
            <div>
              <div class="text-sm font-semibold text-text">{{ t.name }}</div>
              <div class="text-xs text-text-muted">{{ t.role }}</div>
            </div>
          </figcaption>
        </figure>
      </div>

      <p class="mt-8 text-center text-xs italic text-text-muted">
        * Témoignages représentatifs — à remplacer par de vrais retours dès disponibles.
      </p>
    </div>
  </section>
</template>
