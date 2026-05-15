<script setup lang="ts">
import ActivityDashboard from '@/features/activite/components/ActivityDashboard.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Mon Activité',
  pageSubtitle: 'Revenus, performance, export fiscal',
})
</script>

<template>
  <ActivityDashboard />
</template>
