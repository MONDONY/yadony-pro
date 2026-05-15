<script setup lang="ts">
import { computed } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { CustomRule, ConditionField, ActionType } from '@/features/automations/types/index'

const props = defineProps<{
  rule: CustomRule
  isDeleting: boolean
}>()

const emit = defineEmits<{
  'edit': [rule: CustomRule]
  'delete': [id: string]
}>()

const fieldLabels: Record<ConditionField, string> = {
  sender_rating: 'Note expéditeur',
  weight_kg: 'Poids (kg)',
  corridor: 'Corridor',
  content_type: 'Type de contenu',
  capacity_free_kg: 'Capacité libre (kg)',
  hours_before_departure: 'Délai avant départ (h)',
}

const operatorLabels: Record<string, string> = {
  gte: '≥',
  lte: '≤',
  eq: '=',
}

const actionLabels: Record<ActionType, string> = {
  auto_accept: 'Accepter automatiquement',
  auto_reject: 'Refuser automatiquement',
  trigger_search: 'Déclencher une recherche de demandes',
  send_alert: 'Envoyer une alerte push + email',
  invite_sender: "Inviter l'expéditeur sur le trajet",
  close_announcement: "Fermer l'annonce",
}

const conditionSummary = computed(() =>
  props.rule.conditions
    .map((c) => `${fieldLabels[c.field]} ${operatorLabels[c.operator] ?? c.operator} ${c.value}`)
    .join(' ET '),
)

const actionSummary = computed(() => {
  const base = actionLabels[props.rule.action.type]
  if (props.rule.action.type === 'auto_reject' && props.rule.action.message) {
    return `${base} — "${props.rule.action.message}"`
  }
  return base
})
</script>

<template>
  <div
    :data-test="`custom-rule-card-${rule.id}`"
    :class="cn(
      'p-4 bg-surface border rounded-card space-y-3 transition-all duration-200',
      rule.enabled ? 'border-primary/30' : 'border-border opacity-70',
    )"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1 flex-1 min-w-0">
        <p class="text-sm font-semibold text-text truncate">{{ rule.name }}</p>
        <span
          v-if="rule.enabled"
          class="inline-block text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium"
        >
          Active
        </span>
        <span
          v-else
          class="inline-block text-xs px-2 py-0.5 rounded-full border border-border text-text-muted font-medium"
        >
          Inactive
        </span>
      </div>

      <div class="flex items-center gap-1 flex-shrink-0">
        <button
          :data-test="`custom-rule-edit-${rule.id}`"
          class="p-1.5 text-text-muted hover:text-primary transition-colors rounded"
          aria-label="Modifier la règle"
          type="button"
          @click="emit('edit', rule)"
        >
          <Pencil class="w-4 h-4" />
        </button>
        <button
          :data-test="`custom-rule-delete-${rule.id}`"
          :disabled="isDeleting"
          class="p-1.5 text-text-muted hover:text-red-400 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Supprimer la règle"
          type="button"
          @click="!isDeleting && emit('delete', rule.id)"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex items-start gap-2 text-xs">
        <span class="flex-shrink-0 bg-primary/15 text-primary px-2 py-0.5 rounded font-bold">SI</span>
        <p class="text-text-muted leading-relaxed break-words">{{ conditionSummary }}</p>
      </div>
      <div class="flex items-start gap-2 text-xs">
        <span class="flex-shrink-0 bg-accent/15 text-accent px-2 py-0.5 rounded font-bold">ALORS</span>
        <p class="text-text-muted leading-relaxed break-words">{{ actionSummary }}</p>
      </div>
    </div>
  </div>
</template>
