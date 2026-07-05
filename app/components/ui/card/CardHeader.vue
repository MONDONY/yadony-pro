<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div :class="cn('flex items-start justify-between gap-3 px-5 pt-5', $props.class)">
    <slot />
  </div>
</template>
