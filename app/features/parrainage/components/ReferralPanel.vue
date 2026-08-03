<!-- app/features/parrainage/components/ReferralPanel.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { ReferralInfo } from '@/features/parrainage/types/index'

const props = defineProps<{
  referral: ReferralInfo
  isRegenerating: boolean
}>()

const emit = defineEmits<{ regenerate: [] }>()

const copied = ref(false)

const earnedEuros = computed(() => (props.referral.totalEarnedCents / 100).toFixed(2))

async function copyLink() {
  try {
    await navigator.clipboard?.writeText(props.referral.shareUrl)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    /* clipboard indisponible — silencieux */
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="bg-surface-elevated rounded-card p-4">
      <p class="text-sm text-text-muted mb-1">Ton code de parrainage</p>
      <div class="flex flex-wrap items-center gap-3">
        <span class="font-display font-bold text-xl text-primary tracking-wider" data-test="referral-code">
          {{ referral.code }}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="sm:ml-auto"
          data-test="referral-copy"
          @click="copyLink"
        >
          <Check v-if="copied" class="w-4 h-4" />
          <Copy v-else class="w-4 h-4" />
          {{ copied ? 'Copié' : 'Copier le lien' }}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-test="referral-regenerate"
          :disabled="isRegenerating"
          @click="emit('regenerate')"
        >
          <RefreshCw class="w-4 h-4" />
          {{ isRegenerating ? '…' : 'Régénérer' }}
        </Button>
      </div>
      <p class="text-xs text-text-muted mt-2 break-all" data-test="referral-url">{{ referral.shareUrl }}</p>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-surface border border-border rounded-card p-3 text-center">
        <p class="text-lg font-semibold text-text" data-test="stat-invited">{{ referral.totalInvited }}</p>
        <p class="text-xs text-text-muted">Invités</p>
      </div>
      <div class="bg-surface border border-border rounded-card p-3 text-center">
        <p class="text-lg font-semibold text-text" data-test="stat-signedup">{{ referral.signedUp }}</p>
        <p class="text-xs text-text-muted">Inscrits</p>
      </div>
      <div class="bg-surface border border-border rounded-card p-3 text-center">
        <p class="text-lg font-semibold text-text" data-test="stat-rewarded">{{ referral.rewarded }}</p>
        <p class="text-xs text-text-muted">Récompensés</p>
      </div>
      <div class="bg-surface border border-border rounded-card p-3 text-center">
        <p class="text-lg font-semibold text-success" data-test="stat-earned">{{ earnedEuros }} €</p>
        <p class="text-xs text-text-muted">Gagnés</p>
      </div>
    </div>
  </div>
</template>
