<script setup lang="ts">
import { cn } from '@/lib/utils'
import type { TripFilter } from '@/features/trajets/types/index'

const props = defineProps<{
  modelValue: TripFilter
  counts?: Partial<Record<TripFilter, number>>
}>()

const emit = defineEmits<{ 'update:modelValue': [value: TripFilter] }>()

const filters: Array<{ key: TripFilter; label: string }> = [
  { key: 'TOUS', label: 'Tous' },
  { key: 'ACTIFS', label: 'Actifs' },
  { key: 'A_VENIR', label: 'À venir' },
  { key: 'TERMINES', label: 'Terminés' },
  { key: 'ARCHIVES', label: 'Archivés' },
]
</script>

<template>
  <div class="flex items-center gap-1 bg-surface rounded-btn p-1 border border-border" role="tablist">
    <button
      v-for="f in filters"
      :key="f.key"
      role="tab"
      :aria-selected="modelValue === f.key"
      :data-test="`filter-${f.key}`"
      :class="cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
        modelValue === f.key
          ? 'bg-primary text-white shadow-sm'
          : 'text-text-muted hover:text-text',
      )"
      @click="emit('update:modelValue', f.key)"
    >
      {{ f.label }}
      <span
        v-if="counts?.[f.key] !== undefined && counts[f.key]! > 0"
        :class="cn(
          'text-xs px-1.5 py-0.5 rounded-full font-semibold min-w-[18px] text-center',
          modelValue === f.key ? 'bg-white/20 text-white' : 'bg-border text-text-muted',
        )"
      >
        {{ counts[f.key] }}
      </span>
    </button>
  </div>
</template>
