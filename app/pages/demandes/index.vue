<script setup lang="ts">
import MatchingDashboard from '@/features/demandes/components/MatchingDashboard.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Demandes compatibles',
  pageSubtitle: 'Matching inversé sur tes corridors actifs',
})
</script>

<template>
  <MatchingDashboard />
</template>
