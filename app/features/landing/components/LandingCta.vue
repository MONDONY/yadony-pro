<template>
  <section
    class="py-20 border-t"
    style="background: linear-gradient(135deg, rgb(var(--primary-rgb) / 0.12), rgb(var(--accent-rgb) / 0.06)); border-color: rgb(var(--primary-rgb) / 0.15);"
  >
    <div class="max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-10">
      <!-- Gauche -->
      <div class="flex flex-col gap-5 max-w-lg">
        <h2 class="font-display font-bold text-3xl text-text leading-snug">
          Prêt à gérer ton activité comme un pro ?
        </h2>
        <p class="text-text-muted">
          Rejoins les voyageurs dony qui encaissent en sécurité, optimisent leur taux de remplissage et gagnent du temps sur la gestion.
        </p>
        <div class="flex flex-wrap gap-3">
          <NuxtLink
            to="/login"
            class="inline-flex items-center gap-2 font-semibold text-white bg-primary hover:bg-primary-hover px-6 py-3 rounded-btn transition-colors"
          >
            Accéder au cockpit
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </NuxtLink>
        </div>
        <div class="flex items-center gap-2 text-xs text-text-muted">
          <span aria-hidden="true">🔒</span>
          <span>Paiements sécurisés via Stripe · KYC requis depuis l'app mobile</span>
        </div>
      </div>

      <!-- Droite — mascotte -->
      <img
        src="/mascots/pouce_leve.png"
        alt=""
        class="w-48 h-auto object-contain flex-shrink-0 hidden lg:block"
        aria-hidden="true"
      />
    </div>
  </section>
</template>
