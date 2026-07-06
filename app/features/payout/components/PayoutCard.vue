<!-- app/features/payout/components/PayoutCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Wallet } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { PayoutTone, PayoutAction } from '@/features/payout/types/index'

const props = defineProps<{
  label: string
  description: string
  tone: PayoutTone
  action: PayoutAction
  canRefresh: boolean
  isWorking: boolean
}>()

const emit = defineEmits<{ setup: []; refresh: [] }>()

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

const actionLabel = computed(() =>
  props.action === 'continue' ? 'Continuer la configuration' : 'Configurer mes paiements',
)
</script>

<template>
  <div class="bg-surface border border-border rounded-card p-5" data-test="payout-card">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-start gap-3 min-w-0">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" :class="toneClass">
          <Wallet class="w-5 h-5" />
        </span>
        <div class="min-w-0">
          <h2 class="font-display font-semibold text-base text-text">Paiements & versements</h2>
          <p class="text-sm font-medium" :class="toneClass.split(' ')[0]" data-test="payout-label">{{ label }}</p>
          <p class="text-sm text-text-muted mt-0.5" data-test="payout-description">{{ description }}</p>
        </div>
      </div>
    </div>

    <div v-if="action !== 'none' || canRefresh" class="flex items-center gap-2 mt-4">
      <Button
        v-if="action !== 'none'"
        type="button"
        data-test="payout-setup"
        :disabled="isWorking"
        @click="emit('setup')"
      >
        {{ isWorking ? 'Ouverture…' : actionLabel }}
      </Button>
      <Button
        v-if="canRefresh"
        type="button"
        variant="outline"
        data-test="payout-refresh"
        :disabled="isWorking"
        @click="emit('refresh')"
      >
        J’ai terminé — actualiser
      </Button>
    </div>
  </div>
</template>
