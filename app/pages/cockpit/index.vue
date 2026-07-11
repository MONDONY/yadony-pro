<script setup lang="ts">
import { onMounted } from 'vue'
import CockpitDashboard from '@/features/cockpit/components/CockpitDashboard.vue'
import RatingPromptCard from '@/features/ratings/components/RatingPromptCard.vue'
import { useRatings } from '@/features/ratings/composables/useRatings'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Centre de commandes',
  pageSubtitle: "Vue d'ensemble de votre activité",
})

const { pending, isSubmitting, fetchPending, submitRating } = useRatings()

onMounted(() => {
  fetchPending()
})
</script>

<template>
  <div class="space-y-6">
    <RatingPromptCard
      v-if="pending"
      :pending="pending"
      :is-submitting="isSubmitting"
      @submit="submitRating"
    />
    <CockpitDashboard />
  </div>
</template>
