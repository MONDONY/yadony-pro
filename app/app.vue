<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

if (import.meta.dev) {
  const auth = useAuthStore()
  ;(window as unknown as { __donyAuth: ReturnType<typeof useAuthStore> }).__donyAuth = auth
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
