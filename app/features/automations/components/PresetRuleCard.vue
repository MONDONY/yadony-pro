<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import type { PresetRule } from '@/features/automations/types/index'

const props = defineProps<{
  rule: PresetRule
  isUpdating: boolean
}>()

const emit = defineEmits<{
  'toggle': [id: string]
}>()

const ruleDescriptionMap: Record<string, string> = {
  auto_accept_trusted:
    'Accepte automatiquement les bids dont la note expéditeur ≥ seuil configuré ET le poids ≤ capacité restante.',
  auto_reject_overweight:
    'Refuse automatiquement avec un message poli les bids dont le poids demandé dépasse ta capacité restante.',
  auto_close_full:
    "Passe l'annonce en statut FULL dès que ta capacité restante atteint 0 kg.",
  alert_capacity_free:
    'Envoie un push + email quand tu as plus de X kg libres depuis plus de Y heures consécutives.',
  notify_loyal_senders:
    "Invite tes expéditeurs historiques dès qu'une nouvelle annonce est publiée sur leurs corridors habituels.",
  alert_last_minute_bid:
    'Déclenche un push immédiat + SMS quand un bid arrive avec un départ dans moins de 48 h.',
}

const description = computed(
  () => ruleDescriptionMap[props.rule.id] ?? props.rule.description,
)
</script>

<template>
  <div
    :data-test="`preset-rule-card-${rule.id}`"
    :class="cn(
      'flex items-start gap-4 p-4 bg-surface border rounded-card transition-all duration-200',
      rule.enabled ? 'border-primary/40' : 'border-border',
    )"
  >
    <div class="flex-shrink-0 pt-0.5">
      <button
        :data-test="`preset-toggle-${rule.id}`"
        :disabled="isUpdating"
        :aria-label="rule.enabled ? `Désactiver ${rule.label}` : `Activer ${rule.label}`"
        :aria-checked="rule.enabled"
        :class="cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          rule.enabled ? 'bg-primary' : 'bg-border',
          isUpdating && 'opacity-50 cursor-not-allowed',
        )"
        type="button"
        role="switch"
        @click="!isUpdating && emit('toggle', rule.id)"
      >
        <span
          :class="cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
            rule.enabled ? 'translate-x-6' : 'translate-x-1',
          )"
        />
      </button>
    </div>

    <div class="flex-1 min-w-0 space-y-1">
      <div class="flex items-center gap-2 flex-wrap">
        <p class="text-sm font-semibold text-text">{{ rule.label }}</p>
        <span
          v-if="rule.enabled"
          class="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium"
        >
          Active
        </span>
        <span
          v-else
          class="text-xs px-2 py-0.5 rounded-full border border-border text-text-muted font-medium"
        >
          Inactive
        </span>
      </div>
      <p class="text-xs text-text-muted leading-relaxed">{{ description }}</p>
      <p v-if="rule.isConfigurable" class="text-xs text-primary/70 font-medium">
        Seuil configurable via l'API
      </p>
    </div>
  </div>
</template>
