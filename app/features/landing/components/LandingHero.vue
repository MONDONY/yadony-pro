<script setup lang="ts">
import { ArrowRight, Lock, ShieldCheck, BadgeCheck, Package } from 'lucide-vue-next'

const trust = [
  { icon: Lock, label: 'Paiements Stripe' },
  { icon: BadgeCheck, label: 'KYC vérifié' },
  { icon: ShieldCheck, label: 'Fonds en séquestre' },
]

const mockTrips = [
  { route: 'Paris → Dakar', date: '18 mai', status: 'Actif', variant: 'success' },
  { route: 'Lyon → Abidjan', date: '22 mai', status: 'En attente', variant: 'warning' },
  { route: 'CDG → Bamako', date: '01 juin', status: 'Ouvert', variant: 'info' },
] as const

const badgeClass = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-primary/10 text-primary',
}
</script>

<template>
  <section class="relative overflow-hidden pt-16">
    <div class="mx-auto grid max-w-6xl items-center gap-16 px-6 py-24 lg:grid-cols-[1fr_460px]">
      <!-- Colonne éditoriale -->
      <div class="flex flex-col gap-7">
        <div class="flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          <span class="text-xs font-medium text-text-muted">Paris · Lyon · Marseille → Dakar · Abidjan · Bamako</span>
        </div>

        <h1 class="font-display text-[clamp(38px,5.2vw,58px)] font-semibold leading-[1.04] tracking-[-0.03em] text-text text-balance">
          Gérez vos trajets.<br>
          Encaissez <span class="text-primary">en sécurité.</span>
        </h1>

        <p class="max-w-[46ch] text-lg leading-relaxed text-text-muted">
          dony PRO est l'espace de gestion des voyageurs vérifiés. Publiez vos trajets,
          acceptez des colis et suivez vos encaissements en séquestre — depuis le web.
        </p>

        <div class="flex flex-wrap gap-3">
          <NuxtLink
            to="/login"
            class="inline-flex items-center gap-2 rounded-btn bg-primary px-6 py-3 font-semibold text-on-primary shadow-btn transition-colors hover:bg-primary-hover"
          >
            Accéder au cockpit
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </NuxtLink>
          <a
            href="#comment-ca-marche"
            class="inline-flex items-center gap-2 rounded-btn border border-border-strong px-6 py-3 font-medium text-text transition-colors hover:bg-surface-el"
          >
            Comment ça marche
          </a>
        </div>

        <div class="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span v-for="t in trust" :key="t.label" class="inline-flex items-center gap-2 text-sm text-text-muted">
            <component :is="t.icon" class="h-4 w-4 text-text-subtle" :stroke-width="1.75" aria-hidden="true" />
            {{ t.label }}
          </span>
        </div>
      </div>

      <!-- Preuve produit : aperçu réel du cockpit (droit, primitives Comptoir) -->
      <div class="relative hidden lg:block" aria-hidden="true">
        <div class="overflow-hidden rounded-card border border-border bg-surface shadow-pop">
          <div class="flex items-center justify-between border-b border-border px-4 py-3">
            <span class="text-sm font-semibold text-text">Cockpit <span class="text-primary">dony PRO</span></span>
            <span class="h-2 w-2 rounded-full bg-success" />
          </div>
          <div class="flex flex-col gap-4 p-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-el border border-border bg-surface p-3 shadow-card">
                <div class="text-2xs text-text-muted">En séquestre</div>
                <div class="mt-1 font-mono text-lg font-semibold tabular-nums text-text">4 820 €</div>
                <div class="mt-0.5 font-mono text-2xs tabular-nums text-success">▲ 12,4 %</div>
              </div>
              <div class="rounded-el border border-border bg-surface p-3 shadow-card">
                <div class="text-2xs text-text-muted">Colis actifs</div>
                <div class="mt-1 font-mono text-lg font-semibold tabular-nums text-text">7</div>
                <div class="mt-0.5 text-2xs text-text-subtle">2 corridors</div>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <div class="text-2xs font-semibold uppercase tracking-[0.12em] text-text-subtle">Trajets récents</div>
              <div
                v-for="trip in mockTrips"
                :key="trip.route"
                class="flex items-center justify-between rounded-el bg-surface-el px-3 py-2"
              >
                <div>
                  <div class="text-xs font-medium text-text">{{ trip.route }}</div>
                  <div class="font-mono text-2xs tabular-nums text-text-subtle">{{ trip.date }}</div>
                </div>
                <span :class="['rounded-full px-2 py-0.5 text-2xs font-medium', badgeClass[trip.variant]]">{{ trip.status }}</span>
              </div>
            </div>

            <div>
              <div class="mb-1 flex justify-between text-2xs text-text-muted">
                <span>Taux d'acceptation</span>
                <span class="font-mono tabular-nums font-semibold text-success">87 %</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-surface-el">
                <div class="h-full rounded-full bg-success" style="width: 87%" />
              </div>
            </div>
          </div>
        </div>

        <!-- Notification produit (sobre, sans emoji) -->
        <div class="absolute -right-4 top-8 flex items-start gap-2.5 rounded-el border border-border bg-surface px-3 py-2.5 shadow-pop">
          <span class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Package class="h-3.5 w-3.5" :stroke-width="1.75" />
          </span>
          <div>
            <div class="text-xs font-semibold text-text">Nouveau match</div>
            <div class="font-mono text-2xs tabular-nums text-text-muted">Paris → Dakar · 4,2 kg</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
