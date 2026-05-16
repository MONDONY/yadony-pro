<template>
  <section id="comment-ca-marche" class="py-20">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center mb-12">
        <h2 class="font-display font-bold text-3xl text-text mb-3">Comment ça marche</h2>
        <p class="text-text-muted max-w-lg mx-auto">Trois étapes pour gérer ton activité de transporteur comme un professionnel.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article
          v-for="step in steps"
          :key="step.number"
          class="bg-surface rounded-card p-6 border border-border relative overflow-hidden"
        >
          <!-- Border-top dégradée -->
          <div class="absolute top-0 left-0 right-0 h-0.5 rounded-t-card" :style="{ background: step.gradient }" aria-hidden="true" />

          <!-- Numéro pill -->
          <div
            class="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mb-4"
            :style="{ backgroundColor: step.pillBg, color: step.pillColor }"
          >{{ step.number }}</div>

          <!-- Mascotte -->
          <img
            :src="step.mascot"
            :alt="step.mascotAlt"
            class="w-20 h-20 object-contain mb-4"
          />

          <h3 class="font-display font-bold text-lg text-text mb-2">{{ step.title }}</h3>
          <p class="text-sm text-text-muted leading-relaxed">{{ step.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = [
  {
    number: '1',
    gradient: 'linear-gradient(90deg, var(--primary), var(--primary-h))',
    pillBg: 'rgb(var(--primary-rgb) / 0.15)',
    pillColor: 'var(--primary)',
    mascot: '/mascots/tenant_colis.png',
    mascotAlt: 'Mascotte dony tenant un colis',
    title: 'Publie ton trajet',
    description: 'Déclare ta destination, ta date de départ et la capacité bagage disponible. En quelques minutes, ton annonce est visible.',
  },
  {
    number: '2',
    gradient: 'linear-gradient(90deg, var(--accent), var(--accent-h))',
    pillBg: 'rgb(var(--accent-rgb) / 0.15)',
    pillColor: 'var(--accent)',
    mascot: '/mascots/dans_avion.png',
    mascotAlt: 'Mascotte dony dans un avion',
    title: 'Accepte les demandes',
    description: "Consulte les demandes d'expéditeurs vérifiés, négocie directement dans l'app, et confirme les colis que tu transportes.",
  },
  {
    number: '3',
    gradient: 'linear-gradient(90deg, var(--success), #22c55e)',
    pillBg: 'rgb(var(--success-rgb) / 0.15)',
    pillColor: 'var(--success)',
    mascot: '/mascots/colis_livre.png',
    mascotAlt: 'Mascotte dony livrant un colis',
    title: 'Livre et encaisse',
    description: 'Scanne le QR à la livraison. Les fonds en séquestre sont libérés automatiquement sur ton compte Stripe sous 48h.',
  },
]
</script>
