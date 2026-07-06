<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePublicProfile } from '@/features/profil-public/composables/usePublicProfile'
import PublicProfilePreview from '@/features/profil-public/components/PublicProfilePreview.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Mon profil public',
  pageSubtitle: 'Ce que voient les expéditeurs',
})

const auth = useAuthStore()
const { profile, isLoading, error, fetchProfile } = usePublicProfile()

onMounted(() => {
  if (auth.user?.id) fetchProfile(auth.user.id)
})
</script>

<template>
  <div class="max-w-2xl space-y-4">
    <p class="text-sm text-text-muted">
      Aperçu de ton profil tel qu'il apparaît aux expéditeurs lors du matching et des négociations.
    </p>

    <p v-if="error" class="text-sm text-danger" data-test="pp-error">{{ error }}</p>
    <div v-else-if="isLoading" class="py-8 text-center text-sm text-text-muted" data-test="pp-loading">Chargement…</div>
    <PublicProfilePreview v-else-if="profile" :profile="profile" />
  </div>
</template>
