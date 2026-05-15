<script setup lang="ts">
import AutomationsDashboard from '@/features/automations/components/AutomationsDashboard.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Automatisations',
  pageSubtitle: 'Règles préconfigurées et personnalisées',
})
</script>

<template>
  <AutomationsDashboard />
</template>
