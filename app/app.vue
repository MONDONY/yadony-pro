<script setup lang="ts">
import MaintenanceScreen from '@/features/maintenance/components/MaintenanceScreen.vue'
import { useMaintenanceStore } from '@/stores/maintenance'

// Mode maintenance : le portail reste monté dessous, inerte, pour être retrouvé
// tel quel à la réouverture.
const maintenance = useMaintenanceStore()
</script>

<template>
  <div :inert="maintenance.active || undefined" :aria-hidden="maintenance.active || undefined">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
  <MaintenanceScreen v-if="maintenance.active" />
</template>
