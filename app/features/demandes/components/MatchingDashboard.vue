<!-- app/features/demandes/components/MatchingDashboard.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMatchingRequests } from '@/features/demandes/composables/useMatchingRequests'
import MatchingRequestGroup from '@/features/demandes/components/MatchingRequestGroup.vue'
import NegotiationStartModal from '@/features/negociations/components/NegotiationStartModal.vue'
import type { MatchingRequest } from '@/features/demandes/types/index'

const { requests, isLoading, error, fetchRequests } = useMatchingRequests()

onMounted(() => { fetchRequests() })

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

const negotiatingRequest = ref<MatchingRequest | null>(null)
const negotiatingId = ref<string | null>(null)
const negotiatedIds = ref<Set<string>>(new Set())

function openNegotiateModal(request: MatchingRequest) {
  negotiatingId.value = request.id
  negotiatingRequest.value = request
}

function closeModal() {
  negotiatingRequest.value = null
  negotiatingId.value = null
}
</script>

<template>
  <div class="space-y-8">
    <div v-if="error && !isLoading" class="flex flex-col items-center justify-center py-16 text-center">
      <p class="text-red-400 font-medium">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
        type="button"
        @click="fetchRequests()"
      >
        Réessayer
      </button>
    </div>

    <div v-else-if="isLoading" class="space-y-6">
      <div v-for="g in 2" :key="g" class="space-y-3">
        <div class="h-4 bg-surface border border-border rounded w-48 animate-pulse" />
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <div v-for="i in 3" :key="i" class="h-48 bg-surface border border-border rounded-card animate-pulse" />
        </div>
      </div>
    </div>

    <div
      v-else-if="groups.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-card"
    >
      <p class="text-text-muted font-medium">Aucune demande compatible trouvée.</p>
      <p class="text-xs text-text-muted mt-2 max-w-xs">
        Les demandes compatibles apparaissent quand des expéditeurs cherchent sur tes corridors actifs dans ta fenêtre de dates.
      </p>
    </div>

    <div v-else class="space-y-8">
      <MatchingRequestGroup
        v-for="group in groups"
        :key="group.tripId"
        :trip-id="group.tripId"
        :trip-corridor="group.tripCorridor"
        :requests="group.requests"
        :negotiating-id="negotiatingId"
        :negotiated-ids="negotiatedIds"
        @negotiate="openNegotiateModal"
      />
    </div>

    <NegotiationStartModal
      :request="negotiatingRequest"
      @close="closeModal"
      @success="(id) => negotiatedIds.value = new Set([...negotiatedIds.value, id])"
    />
  </div>
</template>
