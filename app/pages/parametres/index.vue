<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBusinessPreferences } from '@/features/parametres/composables/useBusinessPreferences'
import { useKyc } from '@/features/kyc/composables/useKyc'
import { usePayout } from '@/features/payout/composables/usePayout'
import ProfileInfoCard from '@/features/parametres/components/ProfileInfoCard.vue'
import BusinessPreferencesForm from '@/features/parametres/components/BusinessPreferencesForm.vue'
import KycStatusCard from '@/features/kyc/components/KycStatusCard.vue'
import PayoutCard from '@/features/payout/components/PayoutCard.vue'
import type { BusinessPreferences } from '@/features/parametres/types/index'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Paramètres',
  pageSubtitle: 'Ton profil et tes préférences de travail',
})

const auth = useAuthStore()
const { preferences, isLoading, isSaving, error, savedAt, fetchPreferences, savePreferences } =
  useBusinessPreferences()
const {
  descriptor: kycDescriptor,
  isStarting: kycStarting,
  fetchStatus: fetchKycStatus,
  startVerification: startKycVerification,
} = useKyc()
const {
  descriptor: payoutDescriptor,
  isWorking: payoutWorking,
  fetchAccount: fetchPayoutAccount,
  startOnboarding: startPayoutOnboarding,
  refresh: refreshPayout,
} = usePayout()

onMounted(() => {
  fetchPreferences()
  fetchKycStatus()
  fetchPayoutAccount()
})

async function onSubmit(next: BusinessPreferences) {
  await savePreferences(next)
}

async function onVerifyKyc() {
  const url = await startKycVerification()
  if (url && import.meta.client) {
    window.open(url, '_blank', 'noopener')
  }
}

async function onSetupPayout() {
  const url = await startPayoutOnboarding()
  if (url && import.meta.client) {
    window.open(url, '_blank', 'noopener')
  }
}
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <ProfileInfoCard
      :display-name="auth.user?.displayName ?? null"
      :phone-number="auth.user?.phoneNumber ?? null"
      :is-pro-account="auth.isProAccount"
      :roles="auth.user?.roles ?? []"
    />

    <KycStatusCard
      :label="kycDescriptor.label"
      :tone="kycDescriptor.tone"
      :can-verify="kycDescriptor.canVerify"
      :is-starting="kycStarting"
      @verify="onVerifyKyc"
    />

    <PayoutCard
      :label="payoutDescriptor.label"
      :description="payoutDescriptor.description"
      :tone="payoutDescriptor.tone"
      :action="payoutDescriptor.action"
      :can-refresh="payoutDescriptor.canRefresh"
      :is-working="payoutWorking"
      @setup="onSetupPayout"
      @refresh="refreshPayout"
    />

    <section class="bg-surface border border-border rounded-card p-5">
      <header class="mb-4">
        <h2 class="font-display font-semibold text-base text-text">Préférences de travail</h2>
        <p class="text-sm text-text-muted">Utilisées par défaut pour tes annonces et le matching.</p>
      </header>

      <div v-if="isLoading" class="py-8 text-center text-sm text-text-muted" data-test="prefs-loading">
        Chargement…
      </div>

      <template v-else>
        <p v-if="error" class="mb-4 text-sm text-danger" data-test="prefs-error">{{ error }}</p>
        <p v-else-if="savedAt" class="mb-4 text-sm text-success" data-test="prefs-saved">
          Préférences enregistrées.
        </p>
        <BusinessPreferencesForm :model-value="preferences" :is-saving="isSaving" @submit="onSubmit" />
      </template>
    </section>
  </div>
</template>
