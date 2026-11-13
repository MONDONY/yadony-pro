<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { transportModeIcon, transportModeLabel } from '@/lib/transportModes'
import type { TransportMode } from '@/features/trajets/types/index'

const props = defineProps<{
  modelValue: TransportMode | null
  /** Modes à afficher, déjà filtrés par l'appelant (interrupteurs du serveur, mode courant). */
  modes: TransportMode[]
  error?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [v: TransportMode] }>()

const ORDER: TransportMode[] = ['PLANE', 'BOAT', 'CAR', 'BUS', 'TRAIN', 'OTHER']

const items = computed(() =>
  [...props.modes]
    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
    .map((key) => ({ key, label: transportModeLabel(key), icon: transportModeIcon(key) })),
)
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="m in items"
        :key="m.key"
        type="button"
        :data-test="`transport-${m.key}`"
        :class="cn(
          'flex items-center gap-2 px-4 py-2 rounded-btn border text-sm font-medium transition-colors',
          modelValue === m.key
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-text-muted hover:border-primary/50 hover:text-text',
        )"
        @click="emit('update:modelValue', m.key)"
      >
        <component :is="m.icon" class="w-4 h-4" />
        {{ m.label }}
      </button>
    </div>
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
  </div>
</template>
