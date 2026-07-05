<script setup lang="ts">
import { type HTMLAttributes, useId } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Enveloppe d'un champ : label + contrôle (slot) + hint / message d'erreur.
 * Relie label et contrôle via un id partagé (slot prop `id`) pour l'a11y.
 */
defineProps<{
  label?: string
  hint?: string
  error?: string
  required?: boolean
  class?: HTMLAttributes['class']
}>()
const id = useId()
</script>

<template>
  <div :class="cn('flex flex-col gap-1.5', $props.class)">
    <label v-if="label" :for="id" class="text-sm font-medium text-text">
      {{ label }}<span v-if="required" class="text-danger"> *</span>
    </label>
    <slot :id="id" :invalid="!!error" />
    <p v-if="error" class="text-xs text-danger">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-text-subtle">{{ hint }}</p>
  </div>
</template>
