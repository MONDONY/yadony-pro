<!-- app/features/cockpit/components/UrgentActionItem.vue -->
<script setup lang="ts">
import { cn } from '@/lib/utils'
import type { UrgentAction } from '@/features/cockpit/types/index'

const props = defineProps<{ action: UrgentAction }>()

const severityConfig = {
  red:    { bar: 'bg-danger',  text: 'text-danger' },
  orange: { bar: 'bg-warning', text: 'text-warning' },
  blue:   { bar: 'bg-primary', text: 'text-primary' },
  green:  { bar: 'bg-success', text: 'text-success' },
}

const cfg = severityConfig[props.action.severity]
</script>

<template>
  <div
    :data-test="`urgent-action-${action.id}`"
    class="flex items-stretch gap-3 rounded-el border border-border bg-surface p-4 shadow-card"
  >
    <!-- Filet de sévérité -->
    <div :class="cn('w-1 shrink-0 rounded-full', cfg.bar)" />

    <div class="min-w-0 flex-1">
      <p :class="cn('text-sm font-semibold', cfg.text)">{{ action.label }}</p>
      <p class="mt-0.5 text-xs text-text-muted">{{ action.detail }}</p>
    </div>

    <NuxtLink
      v-if="action.actionHref && action.actionLabel"
      :to="action.actionHref"
      class="shrink-0 self-center text-xs font-medium text-primary transition-colors hover:text-primary-hover"
    >
      {{ action.actionLabel }}
    </NuxtLink>
  </div>
</template>
