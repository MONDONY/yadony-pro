<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
defineProps<{ class?: HTMLAttributes['class']; as?: string }>()
</script>

<template>
  <component
    :is="$props.as ?? 'p'"
    :class="cn('text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle', $props.class)"
  >
    <slot />
  </component>
</template>
