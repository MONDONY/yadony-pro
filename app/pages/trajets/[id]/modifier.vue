<!-- app/pages/trajets/[id]/modifier.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CheckCircle } from 'lucide-vue-next'
import { tripsService } from '@/features/trajets/services/tripsService'
import NewAnnouncementForm from '@/features/trajets/components/NewAnnouncementForm.vue'
import type { Trip } from '@/features/trajets/types/index'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Modifier le trajet',
  pageSubtitle: 'Mettez à jour les informations de votre annonce',
})

const route = useRoute()
const router = useRouter()
const tripId = route.params.id as string

const trip = ref<Trip | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const updatedTrip = ref<Trip | null>(null)

const svc = tripsService()

onMounted(async () => {
  try {
    trip.value = await svc.getAnnouncement(tripId)
  } catch {
    loadError.value = 'Impossible de charger ce trajet.'
  } finally {
    isLoading.value = false
  }
})

function onSubmitted(t: Trip) {
  updatedTrip.value = t
}

function goBack() {
  router.push(`/trajets/${tripId}`)
}
</script>

<template>
  <div>
    <button
      class="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mb-6"
      @click="goBack"
    >
      <ArrowLeft class="w-4 h-4" />
      Retour au trajet
    </button>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="h-16 bg-surface border border-border rounded-card animate-pulse" />
    </div>

    <!-- Load error -->
    <div v-else-if="loadError" class="flex flex-col items-center py-16 text-center">
      <p class="text-red-500">{{ loadError }}</p>
      <NuxtLink to="/trajets" class="mt-4 text-sm text-text-muted hover:text-text underline">
        Retour aux trajets
      </NuxtLink>
    </div>

    <!-- Success screen -->
    <div
      v-else-if="updatedTrip"
      class="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto"
    >
      <CheckCircle class="w-16 h-16 text-green-400 mb-4" />
      <h2 class="font-bold text-2xl text-text mb-2">Trajet mis à jour</h2>
      <p class="text-text-muted text-sm mb-6">
        {{ updatedTrip.departureCity.label }} → {{ updatedTrip.arrivalCity.label }} a été modifié avec succès.
      </p>
      <button
        class="px-6 py-2.5 rounded-btn bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
        @click="goBack"
      >
        Voir le trajet →
      </button>
    </div>

    <!-- Edit form -->
    <NewAnnouncementForm
      v-else-if="trip"
      :prefill="trip"
      :edit-trip-id="tripId"
      @submitted="onSubmitted"
    />
  </div>
</template>
