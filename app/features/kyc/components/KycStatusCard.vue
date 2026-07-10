<!-- app/features/kyc/components/KycStatusCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { ShieldCheck } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { KycTone } from '@/features/kyc/types/index'

const props = defineProps<{
  label: string
  tone: KycTone
  canVerify: boolean
  isStarting: boolean
}>()

const emit = defineEmits<{ verify: [] }>()

const toneClass = computed(() => {
  switch (props.tone) {
    case 'success':
      return 'text-success bg-success/10'
    case 'warning':
      return 'text-warning bg-warning/10'
    case 'error':
      return 'text-danger bg-danger/10'
    default:
      return 'text-text-muted bg-surface-elevated'
  }
})
</script>

<template>
  <div class="bg-surface border border-border rounded-card p-5" data-test="kyc-card">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 min-w-0">
        <span class="flex h-10 w-10 items-center justify-center rounded-full" :class="toneClass">
          <ShieldCheck class="w-5 h-5" />
        </span>
        <div class="min-w-0">
          <h2 class="font-display font-semibold text-base text-text">Vérification d'identité</h2>
          <p class="text-sm" :class="toneClass.split(' ')[0]" data-test="kyc-label">{{ label }}</p>
        </div>
      </div>

      <Button
        v-if="canVerify"
        type="button"
        data-test="kyc-verify"
        :disabled="isStarting"
        @click="emit('verify')"
      >
        {{ isStarting ? 'Ouverture…' : 'Vérifier mon identité' }}
      </Button>
    </div>
  </div>
</template>
