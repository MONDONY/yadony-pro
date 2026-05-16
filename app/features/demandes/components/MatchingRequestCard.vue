<!-- app/features/demandes/components/MatchingRequestCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import PackageTypePlaceholder from '@/features/demandes/components/PackageTypePlaceholder.vue'
import type { MatchingRequest } from '@/features/demandes/types/index'

const props = defineProps<{
  request: MatchingRequest
  isNegotiating: boolean
  hasNegotiated: boolean
}>()

const emit = defineEmits<{
  negotiate: [request: MatchingRequest]
  'view-detail': [request: MatchingRequest]
}>()

const scoreBadgeClass = computed(() => {
  if (props.request.matchScore >= 85) return 'bg-green-500/15 text-green-400'
  if (props.request.matchScore >= 60) return 'bg-amber-500/15 text-amber-400'
  return 'bg-border text-text-muted'
})

const starsArray = computed(() => Array.from({ length: 5 }, (_, i) => i < Math.round(props.request.senderRating)))
</script>

<template>
  <div
    :data-test="`request-card-${request.id}`"
    class="bg-surface border border-border rounded-card overflow-hidden transition-all duration-200 hover:border-primary/30 flex flex-col"
  >
    <!-- Photo du colis ou placeholder -->
    <img
      v-if="request.packagePhotoUrl"
      :src="request.packagePhotoUrl"
      :alt="`Colis — ${request.contentType}`"
      class="h-32 w-full object-cover shrink-0"
    />
    <PackageTypePlaceholder
      v-else
      :content-type="request.contentType"
      variant="card"
    />

    <div class="p-4 space-y-3 flex-1 flex flex-col">
      <!-- Header: avatar + infos expéditeur + score -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <!-- Avatar (photo ou initiales) -->
          <div class="shrink-0">
            <img
              v-if="request.senderAvatarUrl"
              :src="request.senderAvatarUrl"
              :alt="request.senderName"
              class="w-10 h-10 rounded-full object-cover"
            />
            <div
              v-else
              class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <span class="text-sm font-bold text-primary">{{ request.senderInitials }}</span>
            </div>
          </div>
          <div>
            <p class="text-sm font-semibold text-text">{{ request.senderName }}</p>
            <div class="flex items-center gap-1 mt-0.5">
              <span
                v-for="(filled, i) in starsArray"
                :key="i"
                :class="['text-xs', filled ? 'text-amber-400' : 'text-border']"
              >★</span>
              <span class="text-xs text-text-muted ml-1">{{ request.senderRating.toFixed(1) }}</span>
              <span class="text-border text-xs mx-1">·</span>
              <span class="text-xs text-text-muted">{{ request.senderTotalSent }} envois</span>
            </div>
          </div>
        </div>

        <!-- Score badge -->
        <span
          :data-test="`score-badge-${request.id}`"
          :class="cn('flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full', scoreBadgeClass)"
        >
          {{ request.matchScore }}%
        </span>
      </div>

      <!-- Détails colis -->
      <div class="grid grid-cols-3 gap-2 text-xs">
        <div class="bg-bg rounded p-2 text-center">
          <p class="text-text-muted">Poids</p>
          <p class="font-semibold text-text mt-0.5">{{ request.weightKg }} kg</p>
        </div>
        <div class="bg-bg rounded p-2 text-center">
          <p class="text-text-muted">Budget</p>
          <p class="font-semibold text-text mt-0.5">{{ request.budgetPerKg }} €/kg</p>
        </div>
        <div class="bg-bg rounded p-2 text-center">
          <p class="text-text-muted">Type</p>
          <p class="font-semibold text-text mt-0.5 truncate">{{ request.contentType }}</p>
        </div>
      </div>

      <!-- Message extrait -->
      <p class="text-xs text-text-muted italic leading-relaxed flex-1">
        "{{ request.messageExcerpt }}"
      </p>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-1">
        <!-- Lien détail -->
        <button
          :data-test="`detail-btn-${request.id}`"
          class="text-xs text-primary hover:underline transition-colors"
          type="button"
          @click="emit('view-detail', request)"
        >
          Voir les détails
        </button>

        <!-- Négocier / Déjà envoyé -->
        <button
          v-if="hasNegotiated"
          :data-test="`negotiated-badge-${request.id}`"
          class="h-8 px-3 rounded-btn text-xs font-semibold text-green-400 bg-green-500/15 cursor-default"
          type="button"
          disabled
        >
          ✓ Envoyée
        </button>
        <button
          v-else
          :data-test="`negotiate-btn-${request.id}`"
          :disabled="isNegotiating"
          :class="cn(
            'h-8 px-4 rounded-btn text-xs font-semibold transition-colors',
            isNegotiating
              ? 'bg-border text-text-muted cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90',
          )"
          type="button"
          @click="emit('negotiate', request)"
        >
          {{ isNegotiating ? 'Ouverture…' : 'Négocier' }}
        </button>
      </div>
    </div>
  </div>
</template>
