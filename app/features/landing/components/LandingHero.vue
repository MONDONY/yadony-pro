<template>
  <section
    class="relative pt-16 overflow-hidden"
    style="min-height: 100vh; display: flex; align-items: center;"
  >
    <!-- Fond radial + blobs -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div
        style="position:absolute;inset:0;background:radial-gradient(ellipse at 70% 30%, rgb(var(--primary-rgb) / 0.14) 0%, rgb(var(--accent-rgb) / 0.05) 40%, var(--bg) 65%);"
      />
      <div style="position:absolute;top:15%;left:10%;width:320px;height:320px;border-radius:50%;background:rgb(var(--primary-rgb) / 0.08);filter:blur(70px);" />
      <div style="position:absolute;bottom:20%;right:5%;width:260px;height:260px;border-radius:50%;background:rgb(var(--accent-rgb) / 0.06);filter:blur(70px);" />
    </div>

    <div class="relative max-w-6xl mx-auto px-6 w-full py-20 flex flex-col lg:flex-row items-center" style="gap: 40px;">
      <!-- Colonne gauche -->
      <div class="flex-1 flex flex-col gap-6 max-w-[540px]">
        <!-- Badge animé -->
        <div class="flex items-center gap-2 w-fit px-3 py-1.5 rounded-full border" style="background-color: rgb(var(--primary-rgb) / 0.08); border-color: rgb(var(--primary-rgb) / 0.2);">
          <span class="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
          <span class="text-xs font-medium text-text-muted">Paris · Lyon · Marseille → Dakar · Abidjan · Bamako</span>
        </div>

        <!-- Headline -->
        <h1 class="font-display font-extrabold leading-tight" style="font-size: clamp(36px, 5vw, 52px); color: var(--text);">
          Gérez. Encaissez.<br />
          <span style="color: var(--accent);">Soyez payés.</span>
        </h1>

        <!-- Sous-titre -->
        <p class="text-base text-text-muted leading-relaxed" style="max-width: 440px;">
          dony PRO est l'espace de gestion pour les voyageurs vérifiés. Publiez vos trajets, acceptez des colis, encaissez en sécurité — tout depuis le web.
        </p>

        <!-- CTAs -->
        <div class="flex flex-wrap gap-3">
          <NuxtLink
            to="/login"
            class="inline-flex items-center gap-2 font-semibold text-white bg-primary hover:bg-primary-hover px-6 py-3 rounded-btn transition-colors"
          >
            Accéder au cockpit
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </NuxtLink>
          <a
            href="#"
            class="inline-flex items-center gap-2 font-medium text-text border border-border hover:border-primary hover:text-primary px-6 py-3 rounded-btn transition-colors"
          >
            Voir la démo
          </a>
        </div>

        <!-- Trust chips -->
        <div class="flex flex-wrap gap-2 mt-1">
          <span
            v-for="chip in trustChips"
            :key="chip"
            class="text-xs font-medium text-text-muted px-3 py-1.5 rounded-full border border-border"
            style="background-color: var(--surface-el);"
          >{{ chip }}</span>
        </div>
      </div>

      <!-- Colonne droite — mascottes + app mockup -->
      <div
        class="flex-shrink-0 relative hidden lg:block"
        style="width: 500px; height: 480px;"
        aria-hidden="true"
      >
        <!-- App cockpit mockup (z-index 5, perspective transform) -->
        <div
          class="absolute bg-surface border border-border rounded-card overflow-hidden shadow-2xl"
          style="width:230px;top:0;left:0;z-index:5;transform:perspective(800px) rotateY(-6deg) rotateX(2deg);"
        >
          <div class="bg-surface-el px-3 py-2 border-b border-border flex items-center justify-between">
            <span class="text-[10px] font-bold text-primary">COCKPIT dony PRO</span>
            <span class="w-1.5 h-1.5 rounded-full bg-success" />
          </div>
          <div class="p-3 flex flex-col gap-2">
            <div class="grid grid-cols-2 gap-1.5">
              <div class="rounded-xs p-2" style="background-color: var(--surface-el);">
                <div class="text-[9px] text-text-muted mb-0.5">Ce mois</div>
                <div class="text-sm font-bold font-display text-success">+1 240 €</div>
              </div>
              <div class="rounded-xs p-2" style="background-color: var(--surface-el);">
                <div class="text-[9px] text-text-muted mb-0.5">Colis actifs</div>
                <div class="text-sm font-bold font-display text-primary">7</div>
              </div>
            </div>
            <div class="text-[9px] font-semibold text-text-muted uppercase tracking-wide mt-1">Trajets récents</div>
            <div
              v-for="trip in mockTrips"
              :key="trip.route"
              class="flex items-center justify-between rounded-xs px-2 py-1.5"
              style="background-color: var(--surface-el);"
            >
              <div>
                <div class="text-[10px] font-medium text-text">{{ trip.route }}</div>
                <div class="text-[9px] text-text-muted">{{ trip.date }}</div>
              </div>
              <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" :style="trip.badgeStyle">{{ trip.status }}</span>
            </div>
            <div class="mt-1">
              <div class="flex justify-between text-[9px] text-text-muted mb-1">
                <span>Taux d'acceptation</span>
                <span class="text-success font-semibold">87 %</span>
              </div>
              <div class="h-1 rounded-full overflow-hidden" style="background-color: var(--surface);">
                <div class="h-full rounded-full bg-success" style="width: 87%;" />
              </div>
            </div>
          </div>
        </div>

        <!-- Mascotte principale confiant.png (z-index 3) -->
        <img
          src="/mascots/confiant.png"
          alt="Mascotte dony confiante"
          style="position:absolute;right:0;bottom:0;z-index:3;width:400px;height:auto;object-fit:contain;"
        />

        <!-- Notification flottante (z-index 20) -->
        <div
          class="notification-float absolute bg-surface border border-border rounded-card px-3 py-2 shadow-xl flex items-start gap-2"
          style="top:20px;right:10px;z-index:20;max-width:200px;animation:hero-float 3s ease-in-out infinite;"
        >
          <span class="text-base" aria-hidden="true">📦</span>
          <div>
            <div class="text-[11px] font-semibold text-text">Nouveau match !</div>
            <div class="text-[10px] text-text-muted">Paris → Dakar · 4.2 kg</div>
          </div>
        </div>

        <!-- Mascotte secondaire joyeux.png (z-index 6) -->
        <img
          src="/mascots/joyeux.png"
          alt="Mascotte dony joyeuse"
          style="position:absolute;bottom:20px;left:220px;z-index:6;width:100px;height:auto;object-fit:contain;"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const trustChips = ['🔒 Paiements Stripe', '✓ KYC vérifié', '🛡 Fonds en séquestre']

const mockTrips = [
  {
    route: 'Paris → Dakar',
    date: '18 mai',
    status: 'Actif',
    badgeStyle: 'background-color: rgb(var(--success-rgb) / 0.15); color: var(--success);',
  },
  {
    route: 'Lyon → Abidjan',
    date: '22 mai',
    status: 'Pending',
    badgeStyle: 'background-color: rgb(var(--warning-rgb) / 0.15); color: var(--warning);',
  },
  {
    route: 'CDG → Bamako',
    date: '01 juin',
    status: 'Ouvert',
    badgeStyle: 'background-color: rgb(var(--primary-rgb) / 0.15); color: var(--primary);',
  },
]
</script>

<style scoped>
@keyframes hero-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@media (prefers-reduced-motion: reduce) {
  .notification-float {
    animation: none !important;
  }
}
</style>
