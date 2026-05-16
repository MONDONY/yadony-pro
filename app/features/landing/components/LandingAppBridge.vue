<template>
  <section
    class="py-12 border-y"
    style="background: linear-gradient(135deg, rgb(var(--accent-rgb) / 0.08), rgb(var(--primary-rgb) / 0.06)); border-color: rgb(var(--accent-rgb) / 0.15);"
  >
    <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
      <!-- Gauche : explication -->
      <div class="flex items-start gap-4">
        <span class="text-3xl flex-shrink-0" aria-hidden="true">📱</span>
        <div>
          <h2 class="text-lg font-bold font-display text-text mb-1">
            Active ton espace PRO depuis l'application mobile
          </h2>
          <p class="text-sm text-text-muted max-w-md">
            dony PRO est une extension de l'app dony. L'accès se débloque après validation KYC.
          </p>
        </div>
      </div>

      <!-- Droite : étapes + CTA -->
      <div class="flex flex-col sm:flex-row items-center gap-5 flex-shrink-0">
        <!-- Étapes en ligne -->
        <div class="flex items-center gap-2 text-sm flex-wrap justify-center">
          <template v-for="(step, i) in steps" :key="step">
            <span class="font-medium text-text">{{ step }}</span>
            <svg
              v-if="i < steps.length - 1"
              width="12" height="12" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.5"
              class="text-text-muted flex-shrink-0"
              aria-hidden="true"
            ><path d="M9 18l6-6-6-6"/></svg>
          </template>
        </div>
        <!-- Bouton CTA -->
        <a
          href="https://dony.app"
          target="_blank"
          rel="noopener noreferrer"
          class="flex-shrink-0 inline-flex items-center gap-2 font-semibold text-white px-5 py-2.5 rounded-btn transition-colors"
          style="background-color: var(--accent);"
        >
          <span aria-hidden="true">📲</span> Télécharger l'app dony
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = ["Ouvre l'app", 'Profil → PRO', 'Active']
</script>
