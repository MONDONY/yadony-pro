<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Surface « Comptoir ». Par défaut elle flotte (ombre en 2 couches, bordure
 * discrète). `flat` = filet seul, sans ombre. `interactive` = micro-lift au hover.
 */
interface Props {
  variant?: 'elevated' | 'flat'
  interactive?: boolean
  as?: string
  class?: HTMLAttributes['class']
}
const props = withDefaults(defineProps<Props>(), {
  variant: 'elevated',
  interactive: false,
  as: 'div',
})

const classes = computed(() =>
  cn(
    'rounded-card bg-surface border border-border',
    props.variant === 'elevated' ? 'shadow-card' : '',
    props.interactive
      && 'transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:shadow-pop motion-reduce:hover:translate-y-0',
    props.class,
  ),
)
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>
