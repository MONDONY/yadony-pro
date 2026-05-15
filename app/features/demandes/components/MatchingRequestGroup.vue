<!-- app/features/demandes/components/MatchingRequestGroup.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import MatchingRequestCard from '@/features/demandes/components/MatchingRequestCard.vue'
import type { MatchingRequest } from '@/features/demandes/types/index'

const props = defineProps<{
  tripId: string
  tripCorridor: string
  requests: MatchingRequest[]
  invitingId: string | null
  invitedIds: Set<string>
}>()

const emit = defineEmits<{
  'invite': [requestId: string, announcementId: string]
}>()

const sortedRequests = computed(() =>
  [...props.requests].sort((a, b) => b.matchScore - a.matchScore),
)
</script>

<template>
  <div :data-test="`request-group-${tripId}`" class="space-y-3">
    <!-- Group header -->
    <div class="flex items-center gap-3">
      <div class="h-px flex-1 bg-border" />
      <div class="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
        <span>✈️ {{ tripCorridor }}</span>
        <span class="bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold">
          {{ requests.length }} demande{{ requests.length > 1 ? 's' : '' }}
        </span>
      </div>
      <div class="h-px flex-1 bg-border" />
    </div>

    <!-- Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      <MatchingRequestCard
        v-for="req in sortedRequests"
        :key="req.id"
        :request="req"
        :is-inviting="invitingId === req.id"
        :is-invited="invitedIds.has(req.id)"
        @invite="(reqId, annId) => emit('invite', reqId, annId)"
      />
    </div>
  </div>
</template>
