<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { BOAT_NOT_VERIFIED_MESSAGE, transportModeIcon, transportModeLabel } from '@/lib/transportModes'
import type { TransportMode } from '@/features/trajets/types/index'

const props = defineProps<{
  modelValue: TransportMode | null
  /** Modes à afficher, déjà filtrés par l'appelant (interrupteurs du serveur, mode courant). */
  modes: TransportMode[]
  /** Modes visibles mais non choisissables (ex. bateau pour un transporteur non vérifié). */
  disabledModes?: TransportMode[]
  /** Raison affichée sous la rangée quand une puce est désactivée. */
  disabledReason?: string | null
  error?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [v: TransportMode] }>()

const ORDER: TransportMode[] = ['PLANE', 'BOAT', 'CAR', 'BUS', 'TRAIN', 'OTHER']

const items = computed(() =>
  [...props.modes]
    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
    .map((key) => ({
      key,
      label: transportModeLabel(key),
      icon: transportModeIcon(key),
      disabled: props.disabledModes?.includes(key) ?? false,
    })),
)

const showUpgradeLink = computed(() => props.disabledReason === BOAT_NOT_VERIFIED_MESSAGE)
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="m in items"
        :key="m.key"
        type="button"
        :data-test="`transport-${m.key}`"
        :disabled="m.disabled"
        :aria-disabled="m.disabled ? 'true' : undefined"
        :class="cn(
          'flex items-center gap-2 px-4 py-2 rounded-btn border text-sm font-medium transition-colors',
          m.disabled && 'opacity-50 cursor-not-allowed',
          modelValue === m.key
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-text-muted',
          !m.disabled && modelValue !== m.key && 'hover:border-primary/50 hover:text-text',
        )"
        @click="!m.disabled && emit('update:modelValue', m.key)"
      >
        <component :is="m.icon" class="w-4 h-4" />
        {{ m.label }}
      </button>
    </div>
    <p v-if="disabledReason" class="mt-2 text-xs text-text-muted" data-test="transport-disabled-reason">
      {{ disabledReason }}
      <NuxtLink v-if="showUpgradeLink" to="/upgrade" class="font-medium text-primary hover:underline whitespace-nowrap">
        Passer en PRO
      </NuxtLink>
    </p>
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
  </div>
</template>
