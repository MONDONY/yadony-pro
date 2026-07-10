<!-- app/features/activite/components/ActivityKpiCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { ActivityKpi } from '@/features/activite/types/index'

const props = defineProps<ActivityKpi>()

const trendConfig = computed(() => {
  if (props.trend === 'up') return { icon: TrendingUp, colorClass: 'text-success' }
  if (props.trend === 'down') return { icon: TrendingDown, colorClass: 'text-danger' }
  return { icon: Minus, colorClass: 'text-text-subtle' }
})
</script>

<template>
  <div
    :data-test="`kpi-card-${id}`"
    class="flex flex-col gap-2 rounded-el border border-border bg-surface p-[18px] shadow-card"
  >
    <p class="text-2xs font-medium tracking-wide text-text-muted">{{ label }}</p>
    <p class="font-mono text-2xl font-semibold leading-none tracking-tight text-text tabular-nums">{{ value }}</p>
    <div v-if="trend" class="mt-0.5 flex items-center gap-1">
      <component :is="trendConfig.icon" :class="cn('h-3.5 w-3.5', trendConfig.colorClass)" />
      <span :class="cn('font-mono text-xs font-medium tabular-nums', trendConfig.colorClass)">{{ trendValue }}</span>
    </div>
  </div>
</template>
