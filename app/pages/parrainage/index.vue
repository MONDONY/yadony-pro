<script setup lang="ts">
import { onMounted } from 'vue'
import { useReferral } from '@/features/parrainage/composables/useReferral'
import ReferralPanel from '@/features/parrainage/components/ReferralPanel.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Parrainage',
  pageSubtitle: 'Invite des voyageurs et gagne des récompenses',
})

const { referral, isLoading, isRegenerating, error, fetchReferral, regenerate } = useReferral()

onMounted(() => {
  fetchReferral()
})
</script>

<template>
  <div class="max-w-2xl space-y-4">
    <section class="bg-surface border border-border rounded-card p-5">
      <p v-if="error" class="mb-3 text-sm text-danger" data-test="referral-error">{{ error }}</p>
      <div v-if="isLoading" class="py-8 text-center text-sm text-text-muted" data-test="referral-loading">Chargement…</div>
      <ReferralPanel
        v-else-if="referral"
        :referral="referral"
        :is-regenerating="isRegenerating"
        @regenerate="regenerate"
      />
    </section>
  </div>
</template>
