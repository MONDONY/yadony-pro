<template>
  <section class="py-20" style="background-color: var(--surface-el);">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center mb-12">
        <h2 class="font-display font-bold text-3xl text-text mb-3">Ce qu'en disent les voyageurs</h2>
        <p class="text-text-muted">Ils gèrent leur activité depuis dony PRO.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <figure
          v-for="t in testimonials"
          :key="t.name"
          class="bg-surface rounded-card p-6 border border-border flex flex-col gap-4"
        >
          <!-- Étoiles -->
          <div class="flex gap-0.5" :aria-label="`5 étoiles sur 5`">
            <span v-for="i in 5" :key="i" style="color: #F59E0B; font-size: 14px;" aria-hidden="true">★</span>
          </div>

          <!-- Citation -->
          <blockquote class="relative flex-1">
            <span
              class="absolute -top-2 -left-1 font-display font-bold leading-none select-none"
              style="font-size: 40px; color: var(--primary); opacity: 0.4;"
              aria-hidden="true"
            >"</span>
            <p class="text-sm text-text leading-relaxed pt-3">{{ t.quote }}</p>
          </blockquote>

          <!-- Auteur -->
          <figcaption class="flex items-center gap-3 pt-4 border-t border-border">
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style="background: linear-gradient(135deg, var(--primary), var(--accent));"
              aria-hidden="true"
            >{{ t.initials }}</div>
            <div>
              <div class="text-sm font-semibold text-text">{{ t.name }}</div>
              <div class="text-xs text-text-muted">{{ t.role }}</div>
            </div>
          </figcaption>
        </figure>
      </div>

      <p class="text-center text-xs text-text-muted mt-8 italic">
        * Témoignages représentatifs — à remplacer par de vrais retours dès disponibles.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
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
