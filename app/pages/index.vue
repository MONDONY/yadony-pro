<!-- app/pages/index.vue -->
<script setup lang="ts">
import CockpitDashboard from '@/features/cockpit/components/CockpitDashboard.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Centre de commandes',
  pageSubtitle: 'Ton cockpit opérationnel',
})
</script>

<template>
  <CockpitDashboard />
</template>
