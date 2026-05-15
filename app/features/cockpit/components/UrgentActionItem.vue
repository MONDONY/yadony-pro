<!-- app/features/cockpit/components/UrgentActionItem.vue -->
<script setup lang="ts">
import { cn } from '@/lib/utils'
import type { UrgentAction } from '@/features/cockpit/types/index'

const props = defineProps<{ action: UrgentAction }>()

const severityConfig = {
  red:    { bar: 'bg-red-500',    bg: 'bg-red-500/8',    text: 'text-red-400',    link: 'text-red-300 hover:text-red-200' },
  orange: { bar: 'bg-amber-500',  bg: 'bg-amber-500/8',  text: 'text-amber-400',  link: 'text-amber-300 hover:text-amber-200' },
  blue:   { bar: 'bg-blue-500',   bg: 'bg-blue-500/8',   text: 'text-blue-400',   link: 'text-blue-300 hover:text-blue-200' },
  green:  { bar: 'bg-green-500',  bg: 'bg-green-500/8',  text: 'text-green-400',  link: 'text-green-300 hover:text-green-200' },
}

const cfg = severityConfig[props.action.severity]
</script>

<template>
  <div
    :data-test="`urgent-action-${action.id}`"
    :class="cn('flex items-start gap-3 rounded-card px-4 py-3 border border-border', cfg.bg)"
  >
    <!-- Color bar -->
    <div :class="cn('w-1 rounded-full self-stretch flex-shrink-0', cfg.bar)" />

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p :class="cn('text-sm font-semibold', cfg.text)">{{ action.label }}</p>
      <p class="text-xs text-text-muted mt-0.5">{{ action.detail }}</p>
    </div>

    <!-- Link -->
    <NuxtLink
      v-if="action.actionHref && action.actionLabel"
      :to="action.actionHref"
      :class="cn('text-xs font-medium flex-shrink-0 underline underline-offset-2 transition-colors', cfg.link)"
    >
      {{ action.actionLabel }}
    </NuxtLink>
  </div>
</template>
