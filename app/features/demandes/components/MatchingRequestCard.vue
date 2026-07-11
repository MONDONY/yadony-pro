<!-- app/features/demandes/components/MatchingRequestCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { Check, Star } from 'lucide-vue-next'
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import PackageTypePlaceholder from '@/features/demandes/components/PackageTypePlaceholder.vue'
import type { MatchingRequest } from '@/features/demandes/types/index'

const props = withDefaults(
  defineProps<{
    request: MatchingRequest
    isNegotiating: boolean
    hasNegotiated: boolean
    isFavorite?: boolean
  }>(),
  { isFavorite: false },
)

const emit = defineEmits<{
  negotiate: [request: MatchingRequest]
  'view-detail': [request: MatchingRequest]
  'toggle-favorite': [requestId: string]
}>()

const scoreBadgeVariant = computed<BadgeVariants['variant']>(() => {
  if (props.request.matchScore >= 85) return 'success'
  if (props.request.matchScore >= 60) return 'warning'
  return 'neutral'
})

const starsArray = computed(() => Array.from({ length: 5 }, (_, i) => i < Math.round(props.request.senderRating)))
</script>

<template>
  <div
    :data-test="`request-card-${request.id}`"
    class="relative flex flex-col overflow-hidden rounded-el border border-border bg-surface shadow-card transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:shadow-pop motion-reduce:hover:translate-y-0"
  >
    <!-- Favori (toggle optimiste, coin haut droit) -->
    <button
      type="button"
      :data-test="`favorite-btn-${request.id}`"
      :aria-pressed="isFavorite ? 'true' : 'false'"
      :aria-label="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
      class="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/40 backdrop-blur-sm transition-transform hover:scale-110 motion-reduce:hover:scale-100"
      @click.stop="emit('toggle-favorite', request.id)"
    >
      <Star class="w-4 h-4" :class="isFavorite ? 'text-warning fill-warning' : 'text-white'" />
    </button>
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
                :class="['text-xs', filled ? 'text-warning' : 'text-border']"
              >★</span>
              <span class="text-xs text-text-muted ml-1 font-mono tabular-nums">{{ request.senderRating.toFixed(1) }}</span>
              <span class="text-border text-xs mx-1">·</span>
              <span class="text-xs text-text-muted"><span class="font-mono tabular-nums">{{ request.senderTotalSent }}</span> envois</span>
            </div>
          </div>
        </div>

        <!-- Score badge -->
        <Badge
          :data-test="`score-badge-${request.id}`"
          :variant="scoreBadgeVariant"
          size="sm"
          class="flex-shrink-0 font-mono tabular-nums"
        >
          {{ request.matchScore }}%
        </Badge>
      </div>

      <!-- Détails colis -->
      <div class="grid grid-cols-3 gap-2 text-xs">
        <div class="rounded-el bg-surface-el p-2 text-center">
          <p class="text-text-muted">Poids</p>
          <p class="font-semibold text-text mt-0.5 font-mono tabular-nums">{{ request.weightKg }} kg</p>
        </div>
        <div class="rounded-el bg-surface-el p-2 text-center">
          <p class="text-text-muted">Budget</p>
          <p class="font-semibold text-text mt-0.5 font-mono tabular-nums">{{ request.budgetPerKg }} €/kg</p>
        </div>
        <div class="rounded-el bg-surface-el p-2 text-center">
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
          class="inline-flex h-8 items-center gap-1 rounded-btn bg-success/10 px-3 text-xs font-semibold text-success cursor-default"
          type="button"
          disabled
        >
          <Check class="h-3.5 w-3.5" aria-hidden="true" /> Envoyée
        </button>
        <button
          v-else
          :data-test="`negotiate-btn-${request.id}`"
          :disabled="isNegotiating"
          :class="cn(
            'h-8 px-4 rounded-btn text-xs font-semibold transition-colors',
            isNegotiating
              ? 'bg-border text-text-muted cursor-not-allowed'
              : 'bg-primary text-on-primary shadow-btn hover:bg-primary-hover',
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
