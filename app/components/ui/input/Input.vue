<script setup lang="ts">
import { type HTMLAttributes, useAttrs } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

interface Props {
  class?: HTMLAttributes['class']
  modelValue?: string | number
  invalid?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
const attrs = useAttrs()
</script>

<template>
  <input
    v-bind="attrs"
    :value="props.modelValue"
    :aria-invalid="props.invalid || undefined"
    :class="cn(
      'flex h-10 w-full rounded-input border bg-surface px-3 text-sm text-text transition-[border-color,box-shadow] duration-150 placeholder:text-text-subtle focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50',
      props.invalid ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/25' : 'border-border-strong',
      props.class,
    )"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
