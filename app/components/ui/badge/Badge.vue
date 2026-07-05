<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { badgeVariants, type BadgeVariants } from '.'
import { cn } from '@/lib/utils'

interface Props {
  variant?: BadgeVariants['variant']
  size?: BadgeVariants['size']
  dot?: boolean
  class?: HTMLAttributes['class']
}
const props = withDefaults(defineProps<Props>(), { dot: true })

const classes = computed(() =>
  cn(badgeVariants({ variant: props.variant, size: props.size, dot: props.dot }), props.class),
)
</script>

<template>
  <span :class="classes"><slot /></span>
</template>
