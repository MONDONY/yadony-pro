<script setup lang="ts">
import CockpitDashboard from '@/features/cockpit/components/CockpitDashboard.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Centre de commandes',
  pageSubtitle: "Vue d'ensemble de votre activité",
})
</script>

<template>
  <CockpitDashboard />
</template>
