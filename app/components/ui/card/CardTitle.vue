<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
defineProps<{ class?: HTMLAttributes['class']; as?: string }>()
</script>

<template>
  <component :is="$props.as ?? 'h3'" :class="cn('font-display text-base font-semibold text-text', $props.class)">
    <slot />
  </component>
</template>
