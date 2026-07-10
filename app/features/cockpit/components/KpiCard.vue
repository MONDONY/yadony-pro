<!-- app/features/cockpit/components/KpiCard.vue -->
<script setup lang="ts">
import { ArrowUpRight, ArrowDownRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { KpiData } from '@/features/cockpit/types/index'

const props = defineProps<KpiData>()

const trendIcon = { up: ArrowUpRight, down: ArrowDownRight, neutral: ArrowUpRight }
const trendClass = {
  up: 'text-success',
  down: 'text-danger',
  neutral: 'text-text-subtle',
}
</script>

<template>
  <div
    :data-test="`kpi-card-${id}`"
    class="flex flex-col gap-2 rounded-el border border-border bg-surface p-[18px] shadow-card"
  >
    <p class="text-[11px] font-medium tracking-wide text-text-muted">{{ label }}</p>
    <p class="font-mono text-2xl font-semibold leading-none tracking-tight text-text tabular-nums">{{ value }}</p>
    <div v-if="subLabel || (trend && trend !== 'neutral')" class="mt-0.5 flex items-center gap-2">
      <span
        v-if="trend && trend !== 'neutral'"
        :class="cn('inline-flex items-center gap-0.5 font-mono text-xs tabular-nums', trendClass[trend])"
      >
        <component :is="trendIcon[trend]" class="h-3.5 w-3.5" aria-hidden="true" />
        <span class="sr-only">{{ trend === 'up' ? 'en hausse' : 'en baisse' }}<template v-if="trendValue"> de </template></span>
        <span v-if="trendValue">{{ trendValue }}</span>
      </span>
      <span v-if="subLabel" class="text-xs text-text-subtle">{{ subLabel }}</span>
    </div>
  </div>
</template>
