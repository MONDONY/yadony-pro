<script setup lang="ts">
import { Plane, Car, Bus, Bike, Footprints } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { TransportMode } from '@/features/trajets/types/index'

defineProps<{
  modelValue: TransportMode | null
  error?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [v: TransportMode] }>()

const modes: Array<{ key: TransportMode; label: string; icon: typeof Plane }> = [
  { key: 'PLANE', label: 'Avion', icon: Plane },
  { key: 'CAR', label: 'Voiture', icon: Car },
  { key: 'TRAIN', label: 'Train', icon: Plane },
  { key: 'BUS', label: 'Bus', icon: Bus },
  { key: 'BOAT', label: 'Bateau', icon: Footprints },
  { key: 'OTHER', label: 'Autre', icon: Footprints },
]
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="m in modes"
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
    <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
  </div>
</template>
