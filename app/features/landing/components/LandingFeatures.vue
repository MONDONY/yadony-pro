<script setup lang="ts">
import { LayoutDashboard, Handshake, Lock, Check, BadgeCheck, ArrowUpRight } from 'lucide-vue-next'

const features = [
  {
    key: 'cockpit',
    icon: LayoutDashboard,
    badge: 'Cockpit opérationnel',
    title: 'Une vue 360° de ton activité',
    description: 'KPIs en temps réel, historique des trajets, revenus encaissés, taux d\'acceptation — tout au même endroit.',
    bullets: [
      'Revenus du mois en un coup d\'œil',
      'Suivi des colis actifs par trajet',
      'Export fiscal en un clic',
    ],
  },
  {
    key: 'matching',
    icon: Handshake,
    badge: 'Matching & négociation',
    title: 'Trouve les bons expéditeurs',
    description: 'Yadony te propose des expéditeurs vérifiés qui correspondent à ton trajet. Négocie le prix directement, sans intermédiaire.',
    bullets: [
      'Matching automatique basé sur ton trajet',
      'Chat intégré pour négocier le tarif',
      'Expéditeurs à l\'identité vérifiée uniquement',
    ],
  },
  {
    key: 'paiements',
    icon: Lock,
    badge: 'Paiements sécurisés',
    title: 'Encaisse sans risque',
    description: 'Les fonds sont bloqués en séquestre Stripe dès la confirmation. Tu es payé automatiquement à la livraison confirmée.',
    bullets: [
      'Séquestre Stripe — fonds garantis avant le vol',
      'Libération automatique après lecture du QR de livraison',
      'Protection en cas de litige via Yadony',
    ],
  },
] as const
</script>

<template>
  <section id="fonctionnalites" class="py-24">
    <div class="mx-auto max-w-6xl px-6">
      <div class="mb-16 text-center">
        <h2 class="font-display text-3xl font-semibold tracking-[-0.02em] text-text text-balance">Tout ce dont tu as besoin</h2>
        <p class="mx-auto mt-3 max-w-lg text-text-muted">Un workspace pensé pour les voyageurs professionnels de la diaspora.</p>
      </div>

      <div class="flex flex-col gap-20">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
        >
          <!-- Texte -->
          <div class="flex flex-col gap-5">
            <div class="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
              <component :is="feature.icon" class="h-4 w-4 text-primary" :stroke-width="1.75" aria-hidden="true" />
              <span class="text-xs font-medium text-text-muted">{{ feature.badge }}</span>
            </div>

            <h3 class="font-display text-2xl font-semibold tracking-[-0.02em] text-text text-balance">{{ feature.title }}</h3>
            <p class="leading-relaxed text-text-muted">{{ feature.description }}</p>

            <ul class="mt-2 flex flex-col gap-2.5" :aria-label="`Points clés de ${feature.title}`">
              <li
                v-for="item in feature.bullets"
                :key="item"
                class="flex items-start gap-2.5 text-sm text-text-muted"
              >
                <Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-success" :stroke-width="2" aria-hidden="true" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>

          <!-- Aperçu produit (surface Comptoir, vraies données mono tabular) -->
          <div class="rounded-card border border-border bg-surface p-5 shadow-pop" aria-hidden="true">
            <!-- Cockpit : KPIs + trajets récents -->
            <div v-if="feature.key === 'cockpit'" class="flex flex-col gap-3">
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-el border border-border bg-surface p-3 shadow-card">
                  <div class="text-2xs text-text-muted">Revenus avril</div>
                  <div class="mt-1 font-mono text-lg font-semibold tabular-nums text-text">3 240 €</div>
                  <div class="mt-0.5 font-mono text-2xs tabular-nums text-success">▲ 8,1 %</div>
                </div>
                <div class="rounded-el border border-border bg-surface p-3 shadow-card">
                  <div class="text-2xs text-text-muted">Colis actifs</div>
                  <div class="mt-1 font-mono text-lg font-semibold tabular-nums text-text">12</div>
                  <div class="mt-0.5 text-2xs text-text-subtle">4 corridors</div>
                </div>
              </div>
              <div class="rounded-el bg-surface-el p-3">
                <div class="mb-2 text-2xs font-semibold uppercase tracking-[0.12em] text-text-subtle">Trajets récents</div>
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-text">Paris → Dakar</span>
                    <span class="font-mono text-xs font-semibold tabular-nums text-success">+680 €</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-text">CDG → Abidjan</span>
                    <span class="font-mono text-xs font-semibold tabular-nums text-success">+530 €</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-text">Lyon → Bamako</span>
                    <span class="text-2xs font-medium text-warning">En cours</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Matching : match + négociation -->
            <div v-else-if="feature.key === 'matching'" class="flex flex-col gap-3">
              <div class="flex items-center justify-between rounded-el bg-surface-el px-3 py-2.5">
                <div>
                  <div class="text-2xs text-text-muted">Nouveau match</div>
                  <div class="text-xs font-medium text-text">Paris → Dakar · 6 kg</div>
                </div>
                <span class="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-2xs font-medium text-success">
                  <BadgeCheck class="h-3 w-3" :stroke-width="1.75" aria-hidden="true" />
                  Vérifié
                </span>
              </div>
              <div class="flex flex-col gap-1.5">
                <div class="max-w-[82%] self-start rounded-el rounded-tl-xs bg-surface-el px-3 py-2 text-xs text-text">Je propose 45 € pour 6 kg ?</div>
                <div class="max-w-[82%] self-end rounded-el rounded-tr-xs bg-primary px-3 py-2 text-xs text-on-primary">Je fais 50 €, c'est mon dernier prix.</div>
                <div class="inline-flex max-w-[82%] items-center gap-1.5 self-start rounded-el rounded-tl-xs bg-success/10 px-3 py-2 text-xs font-medium text-success">
                  <Check class="h-3.5 w-3.5 flex-shrink-0" :stroke-width="2" aria-hidden="true" />
                  Accord ! Je confirme le paiement.
                </div>
              </div>
            </div>

            <!-- Paiements : séquestre en 3 étapes -->
            <div v-else class="flex flex-col gap-2">
              <div class="flex items-center gap-3">
                <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">1</span>
                <span class="text-xs text-text">Expéditeur confirme · <span class="font-medium text-success">Fonds bloqués</span></span>
              </div>
              <div class="ml-3.5 h-4 w-px bg-border"></div>
              <div class="flex items-center gap-3">
                <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-warning/10 font-mono text-xs font-semibold text-warning">2</span>
                <span class="text-xs text-text">Tu transportes le colis · <span class="font-medium text-warning">En séquestre</span></span>
              </div>
              <div class="ml-3.5 h-4 w-px bg-border"></div>
              <div class="flex items-center gap-3">
                <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-success/10 font-mono text-xs font-semibold text-success">3</span>
                <span class="text-xs text-text">Lecture QR livraison · <span class="font-medium text-success">Virement automatique</span></span>
              </div>
              <div class="mt-1 flex items-center gap-2 rounded-el border border-success/20 bg-success/5 px-3 py-2.5 text-xs font-medium text-success">
                <ArrowUpRight class="h-4 w-4 flex-shrink-0" :stroke-width="1.75" aria-hidden="true" />
                <span><span class="font-mono tabular-nums">+1 240 €</span> virés sur ton compte Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
