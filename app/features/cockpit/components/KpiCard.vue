<!-- app/features/cockpit/components/KpiCard.vue -->
<script setup lang="ts">
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { KpiData } from '@/features/cockpit/types/index'

const props = defineProps<KpiData>()

const trendIcon = { up: TrendingUp, down: TrendingDown, neutral: Minus }
const trendClass = {
  up: 'text-green-400',
  down: 'text-red-400',
  neutral: 'text-text-muted',
}
</script>

<template>
  <div
    :data-test="`kpi-card-${id}`"
    class="bg-surface border border-border rounded-card p-5 flex flex-col gap-2 hover:border-primary/30 transition-colors"
  >
    <p class="text-xs font-medium text-text-muted uppercase tracking-wider">{{ label }}</p>
    <p class="text-2xl font-bold text-text font-display">{{ value }}</p>
    <div v-if="subLabel || trend" class="flex items-center gap-2 mt-auto">
      <div
        v-if="trend"
        :class="cn('flex items-center gap-1 text-xs font-medium', trendClass[trend])"
      >
        <component :is="trendIcon[trend]" class="w-3.5 h-3.5" />
        <span v-if="trendValue">{{ trendValue }}</span>
      </div>
      <span v-if="subLabel" class="text-xs text-text-muted">{{ subLabel }}</span>
    </div>
  </div>
</template>
