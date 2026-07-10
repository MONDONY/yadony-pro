<script setup lang="ts">
import RecurrencesManager from '@/features/trajets/components/RecurrencesManager.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Trajets récurrents',
  pageSubtitle: 'Publie automatiquement tes trajets selon un planning',
})
</script>

<template>
  <RecurrencesManager />
</template>
