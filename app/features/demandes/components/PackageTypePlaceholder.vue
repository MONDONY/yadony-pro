<script setup lang="ts">
import { Package } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

/**
 * Placeholder affiché quand une demande de colis n'a pas de photo.
 * Reconstruit d'après l'usage dans MatchingRequestCard (fallback de l'image).
 */
withDefaults(defineProps<{
  contentType?: string
  variant?: 'card' | 'inline'
}>(), { variant: 'card' })
</script>

<template>
  <div
    :class="cn(
      'flex shrink-0 flex-col items-center justify-center gap-1.5 bg-surface-el text-text-subtle',
      variant === 'card' ? 'h-32 w-full' : 'h-16 w-16 rounded-el',
    )"
  >
    <Package class="h-6 w-6" :stroke-width="1.75" aria-hidden="true" />
    <span v-if="contentType" class="px-2 text-center text-2xs font-medium text-text-muted">{{ contentType }}</span>
  </div>
</template>
