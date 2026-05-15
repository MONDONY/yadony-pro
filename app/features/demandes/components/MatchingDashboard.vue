<!-- app/features/demandes/components/MatchingDashboard.vue -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMatchingRequests } from '@/features/demandes/composables/useMatchingRequests'
import MatchingRequestGroup from '@/features/demandes/components/MatchingRequestGroup.vue'
import type { MatchingRequest } from '@/features/demandes/types/index'

const { requests, isLoading, error, invitingId, invitedIds, fetchRequests, inviteRequest } =
  useMatchingRequests()

onMounted(() => {
  fetchRequests()
})

// Grouper par tripId, conserver l'ordre de premier apparition
const groups = computed(() => {
  const map = new Map<string, { tripId: string; tripCorridor: string; requests: MatchingRequest[] }>()
  for (const req of requests.value) {
    if (!map.has(req.tripId)) {
      map.set(req.tripId, { tripId: req.tripId, tripCorridor: req.tripCorridor, requests: [] })
    }
    map.get(req.tripId)!.requests.push(req)
  }
  return [...map.values()]
})
</script>

<template>
  <div class="space-y-8">

    <!-- Error state -->
    <div
      v-if="error && !isLoading"
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <p class="text-red-400 font-medium">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
        type="button"
        @click="fetchRequests()"
      >
        Réessayer
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-else-if="isLoading" class="space-y-6">
      <div
        v-for="g in 2"
        :key="g"
        class="space-y-3"
      >
        <div class="h-4 bg-surface border border-border rounded w-48 animate-pulse" />
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <div
            v-for="i in 3"
            :key="i"
            class="h-48 bg-surface border border-border rounded-card animate-pulse"
          />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="groups.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-card"
    >
      <p class="text-text-muted font-medium">Aucune demande compatible trouvée.</p>
      <p class="text-xs text-text-muted mt-2 max-w-xs">
        Les demandes compatibles apparaissent quand des expéditeurs cherchent sur tes corridors actifs dans ta fenêtre de dates.
      </p>
    </div>

    <!-- Groups -->
    <div v-else class="space-y-8">
      <MatchingRequestGroup
        v-for="group in groups"
        :key="group.tripId"
        :trip-id="group.tripId"
        :trip-corridor="group.tripCorridor"
        :requests="group.requests"
        :inviting-id="invitingId"
        :invited-ids="invitedIds"
        @invite="(reqId, annId) => inviteRequest(reqId, annId)"
      />
    </div>

  </div>
</template>
