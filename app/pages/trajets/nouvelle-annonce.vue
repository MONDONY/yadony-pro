<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, CheckCircle } from 'lucide-vue-next'
import NewAnnouncementForm from '@/features/trajets/components/NewAnnouncementForm.vue'
import type { Trip } from '@/features/trajets/types/index'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Nouvelle annonce',
  pageSubtitle: 'Publiez votre trajet et commencez à recevoir des colis',
})

const router = useRouter()
const submittedTrip = ref<Trip | null>(null)

function onSubmitted(trip: Trip) {
  submittedTrip.value = trip
}

function goToTrip() {
  if (submittedTrip.value) {
    router.push(`/trajets/${submittedTrip.value.id}`)
  }
}

function goBack() {
  router.push('/trajets')
}
</script>

<template>
  <div>
    <button
      class="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mb-6"
      @click="goBack"
    >
      <ArrowLeft class="w-4 h-4" />
      Retour aux trajets
    </button>

    <div
      v-if="submittedTrip"
      class="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto"
    >
      <CheckCircle class="w-16 h-16 text-green-400 mb-4" />
      <h2 class="font-bold text-2xl text-text mb-2">
        <template v-if="submittedTrip.status === 'ACTIVE'">Trajet publié !</template>
        <template v-else>Trajet enregistré</template>
      </h2>
      <p class="text-text-muted text-sm mb-6">
        <template v-if="submittedTrip.status === 'ACTIVE'">
          Votre trajet {{ submittedTrip.departureCity.label }} → {{ submittedTrip.arrivalCity.label }} est maintenant visible par les expéditeurs.
        </template>
        <template v-else>
          Votre trajet a été enregistré.
        </template>
      </p>
      <div class="flex gap-3">
        <button
          class="px-6 py-2.5 rounded-btn border border-border text-sm font-medium text-text-muted hover:text-text hover:border-primary/50 transition-colors"
          @click="goBack"
        >
          Retour à la liste
        </button>
        <button
          class="px-6 py-2.5 rounded-btn bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          @click="goToTrip"
        >
          Gérer ce trajet →
        </button>
      </div>
    </div>

    <NewAnnouncementForm v-else @submitted="onSubmitted" />
  </div>
</template>
