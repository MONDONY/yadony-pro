<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { ArrowUpRight, ArrowDownRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

/**
 * Tuile de KPI « Comptoir » : label discret, valeur en Geist Mono tabular,
 * delta sémantique (↗ vert / ↘ rouge). Sparkline optionnelle via slot.
 */
type Trend = 'up' | 'down' | 'neutral'
interface Props {
  label: string
  value: string | number
  trend?: Trend
  trendValue?: string
  sub?: string
  class?: HTMLAttributes['class']
}
const props = defineProps<Props>()

const deltaClass = computed(() => ({
  up: 'text-success',
  down: 'text-danger',
  neutral: 'text-text-subtle',
}[props.trend ?? 'neutral']))

const deltaIcon = computed(() => (props.trend === 'down' ? ArrowDownRight : ArrowUpRight))
</script>

<template>
  <div :class="cn('flex flex-col gap-2 rounded-el bg-surface border border-border shadow-card p-[18px]', props.class)">
    <p class="text-[11px] font-medium text-text-muted tracking-wide">{{ label }}</p>
    <p class="font-mono text-2xl font-semibold text-text tabular-nums tracking-tight leading-none">{{ value }}</p>
    <div v-if="trend || sub || $slots.spark" class="flex items-center gap-2 mt-0.5">
      <span
        v-if="trend && trend !== 'neutral'"
        :class="cn('inline-flex items-center gap-0.5 font-mono text-xs tabular-nums', deltaClass)"
      >
        <component :is="deltaIcon" class="w-3.5 h-3.5" aria-hidden="true" />
        <span v-if="trendValue">{{ trendValue }}</span>
      </span>
      <span v-if="sub" class="text-xs text-text-subtle">{{ sub }}</span>
      <span v-if="$slots.spark" class="ml-auto"><slot name="spark" /></span>
    </div>
  </div>
</template>
