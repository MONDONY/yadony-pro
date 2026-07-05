<script setup lang="ts">
import { type HTMLAttributes, computed, useId } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Enveloppe d'un champ : label + contrôle (slot) + hint / message d'erreur.
 * Relie label ↔ contrôle (slot prop `id`) et contrôle ↔ description
 * (slot prop `describedBy`) pour l'a11y.
 */
const props = defineProps<{
  label?: string
  hint?: string
  error?: string
  required?: boolean
  class?: HTMLAttributes['class']
}>()
const id = useId()
const descId = useId()
const describedBy = computed(() => (props.error || props.hint ? descId : undefined))
</script>

<template>
  <div :class="cn('flex flex-col gap-1.5', $props.class)">
    <label v-if="label" :for="id" class="text-sm font-medium text-text">
      {{ label }}<span v-if="required" class="text-danger"> *</span>
    </label>
    <slot :id="id" :invalid="!!error" :described-by="describedBy" />
    <p v-if="error" :id="descId" class="text-xs text-danger">{{ error }}</p>
    <p v-else-if="hint" :id="descId" class="text-xs text-text-subtle">{{ hint }}</p>
  </div>
</template>
