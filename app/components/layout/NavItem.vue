<script setup lang="ts">
defineProps<{
  to: string
  label: string
  badge?: number
}>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-3 rounded-btn px-4 py-2.5 text-text-muted transition-colors hover:bg-surface-el hover:text-text"
    active-class="bg-primary/10 text-primary"
  >
    <slot name="icon" />
    <span class="flex-1 text-sm font-medium">{{ label }}</span>
    <span
      v-if="badge && badge > 0"
      data-test="badge"
      class="min-w-[20px] rounded-full bg-primary px-2 py-0.5 text-center font-mono text-xs font-semibold tabular-nums text-on-primary"
    >
      {{ badge }}
    </span>
  </NuxtLink>
</template>
