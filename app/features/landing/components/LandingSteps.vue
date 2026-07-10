<script setup lang="ts">
import { Route, Inbox, QrCode } from 'lucide-vue-next'

type ChipVariant = 'success' | 'warning' | 'info'

interface StepRow {
  label: string
  value?: string
  mono?: boolean
  chip?: { text: string; variant: ChipVariant }
}

interface Step {
  number: string
  icon: typeof Route
  title: string
  description: string
  preview: { caption: string; rows: StepRow[] }
}

const steps: Step[] = [
  {
    number: '01',
    icon: Route,
    title: 'Publie ton trajet',
    description: 'Déclare ta destination, ta date de départ et la capacité bagage disponible. En quelques minutes, ton annonce est visible.',
    preview: {
      caption: 'Aperçu annonce',
      rows: [
        { label: 'Trajet', value: 'Paris → Dakar' },
        { label: 'Départ', value: '18 mai', mono: true },
        { label: 'Capacité', value: '12 kg', mono: true },
      ],
    },
  },
  {
    number: '02',
    icon: Inbox,
    title: 'Accepte les demandes',
    description: "Consulte les demandes d'expéditeurs vérifiés, négocie directement dans l'app, et confirme les colis que tu transportes.",
    preview: {
      caption: 'Demandes reçues',
      rows: [
        { label: 'Aïssatou D.', value: '4,2 kg', mono: true, chip: { text: 'Accepté', variant: 'success' } },
        { label: 'Moussa K.', value: '2,8 kg', mono: true, chip: { text: 'En attente', variant: 'warning' } },
      ],
    },
  },
  {
    number: '03',
    icon: QrCode,
    title: 'Livre et encaisse',
    description: 'Scanne le QR à la livraison. Les fonds en séquestre sont libérés automatiquement sur ton compte Stripe sous 48h.',
    preview: {
      caption: 'Encaissement',
      rows: [
        { label: 'Montant', value: '320 €', mono: true },
        { label: 'Séquestre', chip: { text: 'Libéré sous 48h', variant: 'success' } },
      ],
    },
  },
]

const chipClass: Record<ChipVariant, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-primary/10 text-primary',
}
</script>

<template>
  <section id="comment-ca-marche" class="py-20">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center mb-12">
        <h2 class="font-display font-semibold text-3xl tracking-[-0.02em] text-text mb-3">Comment ça marche</h2>
        <p class="text-text-muted max-w-lg mx-auto">Trois étapes pour gérer ton activité de transporteur comme un professionnel.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article
          v-for="step in steps"
          :key="step.number"
          class="flex flex-col gap-5 rounded-card border border-border bg-surface p-6 shadow-card"
        >
          <!-- En-tête : index ledger + icône trait -->
          <div class="flex items-center justify-between">
            <span class="font-mono text-2xs font-semibold tabular-nums tracking-[0.14em] text-text-subtle">{{ step.number }}</span>
            <span class="flex h-9 w-9 items-center justify-center rounded-el border border-border bg-surface-el text-primary">
              <component :is="step.icon" class="h-5 w-5" :stroke-width="1.75" aria-hidden="true" />
            </span>
          </div>

          <div>
            <h3 class="font-display font-semibold text-lg tracking-[-0.01em] text-text mb-2">{{ step.title }}</h3>
            <p class="text-sm text-text-muted leading-relaxed">{{ step.description }}</p>
          </div>

          <!-- Preuve produit : surface Comptoir avec vraies données mono -->
          <div class="mt-auto rounded-el border border-border bg-surface-el p-3" aria-hidden="true">
            <div class="mb-2 text-2xs font-semibold uppercase tracking-[0.12em] text-text-subtle">{{ step.preview.caption }}</div>
            <div class="flex flex-col gap-1.5">
              <div
                v-for="row in step.preview.rows"
                :key="row.label"
                class="flex items-center justify-between gap-3"
              >
                <span class="text-xs text-text-muted">{{ row.label }}</span>
                <span class="flex items-center gap-2">
                  <span
                    v-if="row.value"
                    :class="['text-xs text-text', row.mono ? 'font-mono tabular-nums font-medium' : 'font-medium']"
                  >{{ row.value }}</span>
                  <span
                    v-if="row.chip"
                    :class="['rounded-full px-2 py-0.5 text-2xs font-medium', chipClass[row.chip.variant]]"
                  >{{ row.chip.text }}</span>
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
