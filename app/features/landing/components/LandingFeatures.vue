<template>
  <section id="fonctionnalites" class="py-20">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="font-display font-bold text-3xl text-text mb-3">Tout ce dont tu as besoin</h2>
        <p class="text-text-muted max-w-lg mx-auto">Un workspace pensé pour les voyageurs professionnels de la diaspora.</p>
      </div>

      <div class="flex flex-col gap-20">
        <div
          v-for="(feature, i) in features"
          :key="feature.title"
          class="flex flex-col lg:flex-row items-center gap-12"
          :class="{ 'lg:flex-row-reverse': i % 2 !== 0 }"
        >
          <!-- Texte -->
          <div class="flex-1 flex flex-col gap-5">
            <div
              class="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full text-sm font-semibold"
              :style="feature.badgeStyle"
            >
              <span aria-hidden="true">{{ feature.icon }}</span>
              <span>{{ feature.badge }}</span>
            </div>
            <h3 class="font-display font-bold text-2xl text-text">{{ feature.title }}</h3>
            <p class="text-text-muted leading-relaxed">{{ feature.description }}</p>
            <ul class="flex flex-col gap-2 mt-2" :aria-label="`Points clés de ${feature.title}`">
              <li
                v-for="item in feature.bullets"
                :key="item"
                class="flex items-start gap-2 text-sm text-text-muted"
              >
                <span class="mt-0.5 flex-shrink-0 text-success" aria-hidden="true">✓</span>
                {{ item }}
              </li>
            </ul>
          </div>

          <!-- Visuel CSS mockup -->
          <div class="flex-shrink-0 w-full lg:w-[380px]">
            <div class="bg-surface rounded-card border border-border p-5 shadow-lg" v-html="feature.visual" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    icon: '📊',
    badge: 'Cockpit opérationnel',
    badgeStyle: 'background-color: rgb(var(--primary-rgb) / 0.1); color: var(--primary);',
    title: 'Une vue 360° de ton activité',
    description: 'KPIs en temps réel, historique des trajets, revenus encaissés, taux d\'acceptation — tout au même endroit.',
    bullets: [
      'Revenus du mois en un coup d\'œil',
      'Suivi des colis actifs par trajet',
      'Export fiscal en un clic',
    ],
    visual: `<div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="background:rgb(var(--success-rgb)/0.1);border-radius:12px;padding:12px;">
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">Revenus avril</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);font-family:'Hanken Grotesk',sans-serif;">3 240 €</div>
        </div>
        <div style="background:rgb(var(--primary-rgb)/0.1);border-radius:12px;padding:12px;">
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">Colis actifs</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);font-family:'Hanken Grotesk',sans-serif;">12</div>
        </div>
      </div>
      <div style="background:var(--surface-el);border-radius:12px;padding:12px;">
        <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em;">Trajets récents</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--text);">Paris → Dakar</span><span style="color:var(--success);font-weight:600;">+680 €</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--text);">CDG → Abidjan</span><span style="color:var(--success);font-weight:600;">+530 €</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--text);">Lyon → Bamako</span><span style="color:var(--warning);font-weight:600;">En cours</span></div>
        </div>
      </div>
    </div>`,
  },
  {
    icon: '🤝',
    badge: 'Matching & négociation',
    badgeStyle: 'background-color: rgb(var(--accent-rgb) / 0.1); color: var(--accent);',
    title: 'Trouve les bons expéditeurs',
    description: 'dony te propose des expéditeurs vérifiés qui correspondent à ton trajet. Négocie le prix directement, sans intermédiaire.',
    bullets: [
      'Matching automatique basé sur ton trajet',
      'Chat intégré pour négocier le tarif',
      'Expéditeurs vérifiés KYC uniquement',
    ],
    visual: `<div style="display:flex;flex-direction:column;gap:8px;">
      <div style="background:var(--surface-el);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;">
        <div><div style="font-size:11px;color:var(--muted);">Nouveau match</div><div style="font-size:13px;font-weight:600;color:var(--text);">Paris → Dakar · 6 kg</div></div>
        <span style="background:rgb(var(--success-rgb)/0.15);color:var(--success);font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;">Vérifié ✓</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;padding:4px 0;">
        <div style="align-self:flex-start;background:rgb(var(--primary-rgb)/0.12);border-radius:0 12px 12px 12px;padding:8px 12px;font-size:12px;color:var(--text);max-width:80%;">Je propose 45 € pour 6 kg ?</div>
        <div style="align-self:flex-end;background:var(--primary);border-radius:12px 0 12px 12px;padding:8px 12px;font-size:12px;color:white;max-width:80%;">Je fais 50 €, c'est mon dernier prix.</div>
        <div style="align-self:flex-start;background:rgb(var(--success-rgb)/0.12);border-radius:0 12px 12px 12px;padding:8px 12px;font-size:12px;color:var(--success);max-width:80%;">✓ Accord ! Je confirme le paiement.</div>
      </div>
    </div>`,
  },
  {
    icon: '🔒',
    badge: 'Paiements sécurisés',
    badgeStyle: 'background-color: rgb(var(--success-rgb) / 0.1); color: var(--success);',
    title: 'Encaisse sans risque',
    description: 'Les fonds sont bloqués en séquestre Stripe dès la confirmation. Tu es payé automatiquement à la livraison confirmée.',
    bullets: [
      'Séquestre Stripe — fonds garantis avant le vol',
      'Libération automatique après scan QR livraison',
      'Protection en cas de litige via dony',
    ],
    visual: `<div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgb(var(--primary-rgb)/0.15);color:var(--primary);font-weight:700;flex-shrink:0;">1</div>
        <div style="font-size:12px;color:var(--text);">Expéditeur confirme · <span style="color:var(--success);font-weight:600;">Fonds bloqués</span></div>
      </div>
      <div style="width:2px;height:16px;background:var(--border);margin-left:15px;"></div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgb(var(--warning-rgb)/0.15);color:var(--warning);font-weight:700;flex-shrink:0;">2</div>
        <div style="font-size:12px;color:var(--text);">Tu transportes le colis · <span style="color:var(--warning);">En séquestre</span></div>
      </div>
      <div style="width:2px;height:16px;background:var(--border);margin-left:15px;"></div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgb(var(--success-rgb)/0.15);color:var(--success);font-weight:700;flex-shrink:0;">3</div>
        <div style="font-size:12px;color:var(--text);">Scan QR livraison · <span style="color:var(--success);font-weight:600;">Virement automatique</span></div>
      </div>
      <div style="background:rgb(var(--success-rgb)/0.08);border:1px solid rgb(var(--success-rgb)/0.2);border-radius:12px;padding:10px 12px;margin-top:4px;font-size:12px;color:var(--success);font-weight:600;">💰 +1 240 € virés sur ton compte Stripe</div>
    </div>`,
  },
]
</script>
