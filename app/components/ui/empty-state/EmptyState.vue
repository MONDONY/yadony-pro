<script setup lang="ts">
import { type Component, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * État vide « Comptoir » : icône lucide en trait (jamais d'emoji), titre,
 * texte, action optionnelle via slot. Passer un composant lucide à `icon`.
 */
defineProps<{
  icon?: Component
  title: string
  description?: string
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('flex flex-col items-center text-center px-6 py-16', $props.class)">
    <div
      v-if="icon"
      class="mb-4 flex h-11 w-11 items-center justify-center rounded-el bg-surface-el text-text-subtle"
    >
      <component :is="icon" class="h-5 w-5" :stroke-width="1.75" aria-hidden="true" />
    </div>
    <h3 class="font-display text-base font-semibold text-text">{{ title }}</h3>
    <p v-if="description" class="mt-1.5 max-w-sm text-sm text-text-muted">{{ description }}</p>
    <div v-if="$slots.default" class="mt-5">
      <slot />
    </div>
  </div>
</template>
