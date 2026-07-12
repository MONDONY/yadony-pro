<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { PresetRule, PresetRuleConfig } from '@/features/automations/types/index'

const props = defineProps<{
  rule: PresetRule
  isUpdating: boolean
}>()

const emit = defineEmits<{
  'toggle': [id: string]
  'update-config': [id: string, config: PresetRuleConfig]
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

const localConfig = ref<PresetRuleConfig>({ ...props.rule.config })
watch(() => props.rule.config, (c) => { localConfig.value = { ...c } })

function saveConfig() {
  emit('update-config', props.rule.id, { ...localConfig.value })
}
</script>

<template>
  <div
    :data-test="`preset-rule-card-${rule.id}`"
    :class="cn(
      'flex items-start gap-4 rounded-el border bg-surface p-5 shadow-card transition-all duration-200',
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
        <Badge v-if="rule.enabled" variant="success" size="sm">Active</Badge>
        <Badge v-else variant="neutral" size="sm">Inactive</Badge>
      </div>
      <p class="text-xs text-text-muted leading-relaxed">{{ description }}</p>

      <div v-if="rule.isConfigurable" class="mt-2 flex flex-wrap items-end gap-3">
        <div v-if="rule.id === 'auto_accept_trusted'">
          <label class="block text-2xs text-text-muted mb-0.5">Note minimum</label>
          <input
            v-model.number="localConfig.minRating"
            type="number" min="1" max="5" step="0.1"
            data-test="config-min-rating"
            class="w-20 rounded-input border border-border-strong bg-surface px-2 py-1 text-sm"
            @change="saveConfig"
          />
        </div>
        <template v-if="rule.id === 'alert_capacity_free'">
          <div>
            <label class="block text-2xs text-text-muted mb-0.5">kg libres</label>
            <input
              v-model.number="localConfig.minFreeKg"
              type="number" min="1" step="1"
              data-test="config-min-free-kg"
              class="w-20 rounded-input border border-border-strong bg-surface px-2 py-1 text-sm"
              @change="saveConfig"
            />
          </div>
          <div>
            <label class="block text-2xs text-text-muted mb-0.5">heures consécutives</label>
            <input
              v-model.number="localConfig.minFreeHours"
              type="number" min="1" step="1"
              data-test="config-min-free-hours"
              class="w-20 rounded-input border border-border-strong bg-surface px-2 py-1 text-sm"
              @change="saveConfig"
            />
          </div>
        </template>
        <div v-if="rule.id === 'alert_last_minute_bid'">
          <label class="block text-2xs text-text-muted mb-0.5">heures avant départ</label>
          <input
            v-model.number="localConfig.hoursBeforeDeparture"
            type="number" min="1" step="1"
            data-test="config-hours-before-departure"
            class="w-20 rounded-input border border-border-strong bg-surface px-2 py-1 text-sm"
            @change="saveConfig"
          />
        </div>
      </div>
    </div>
  </div>
</template>
