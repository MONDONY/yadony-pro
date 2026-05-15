<!-- app/features/activite/components/ActivityKpiCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { ActivityKpi } from '@/features/activite/types/index'

const props = defineProps<ActivityKpi>()

const trendConfig = computed(() => {
  if (props.trend === 'up') return { icon: TrendingUp, colorClass: 'text-green-400' }
  if (props.trend === 'down') return { icon: TrendingDown, colorClass: 'text-red-400' }
  return { icon: Minus, colorClass: 'text-text-muted' }
})
</script>

<template>
  <div
    :data-test="`kpi-card-${id}`"
    class="bg-surface border border-border rounded-card p-5 space-y-2"
  >
    <p class="text-xs font-medium text-text-muted uppercase tracking-wider">{{ label }}</p>
    <p class="text-2xl font-bold text-text font-display">{{ value }}</p>
    <div v-if="trend" class="flex items-center gap-1.5">
      <component :is="trendConfig.icon" :class="cn('w-3.5 h-3.5', trendConfig.colorClass)" />
      <span :class="cn('text-xs font-medium', trendConfig.colorClass)">{{ trendValue }}</span>
    </div>
  </div>
</template>
