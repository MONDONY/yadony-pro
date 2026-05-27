<!-- app/features/profil-public/components/PublicProfilePreview.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { BadgeCheck, Award, Star } from 'lucide-vue-next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { PublicProfile } from '@/features/profil-public/types/index'

const props = defineProps<{ profile: PublicProfile }>()

const initials = computed(() =>
  (props.profile.displayName || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const ratingLabel = computed(() =>
  props.profile.ratingCount > 0
    ? `${props.profile.averageRating.toFixed(1)} (${props.profile.ratingCount})`
    : 'Pas encore noté',
)

const memberSinceLabel = computed(() => {
  const d = new Date(props.profile.memberSince)
  if (Number.isNaN(d.getTime())) return props.profile.memberSince
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d)
})
</script>

<template>
  <div class="bg-surface border border-border rounded-card p-6" data-test="public-profile">
    <div class="flex items-center gap-4">
      <Avatar class="h-16 w-16">
        <AvatarImage v-if="profile.avatarUrl" :src="profile.avatarUrl" :alt="profile.displayName" />
        <AvatarFallback class="bg-primary text-white text-xl">{{ initials }}</AvatarFallback>
      </Avatar>
      <div class="min-w-0">
        <p class="font-display font-bold text-xl text-text truncate" data-test="pp-name">{{ profile.displayName }}</p>
        <p class="text-sm text-text-muted">Membre depuis {{ memberSinceLabel }}</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 mt-4">
      <span
        v-if="profile.isKiloPro"
        class="inline-flex items-center gap-1 text-xs font-semibold bg-warning/15 text-warning px-2.5 py-1 rounded-full"
        data-test="pp-kilopro"
      >
        <Award class="w-3.5 h-3.5" /> Kilo Pro
      </span>
      <span
        v-if="profile.kycVerified"
        class="inline-flex items-center gap-1 text-xs font-semibold bg-success/15 text-success px-2.5 py-1 rounded-full"
        data-test="pp-kyc"
      >
        <BadgeCheck class="w-3.5 h-3.5" /> Identité vérifiée
      </span>
      <span
        v-for="badge in profile.badges"
        :key="badge"
        class="text-xs font-medium bg-surface-elevated text-text-muted px-2.5 py-1 rounded-full"
      >
        {{ badge }}
      </span>
    </div>

    <div class="grid grid-cols-2 gap-3 mt-5">
      <div class="bg-surface-elevated rounded-card p-3 text-center">
        <p class="text-lg font-semibold text-text" data-test="pp-completed">{{ profile.completedBidsCount }}</p>
        <p class="text-xs text-text-muted">Livraisons réussies</p>
      </div>
      <div class="bg-surface-elevated rounded-card p-3 text-center">
        <p class="inline-flex items-center gap-1 text-lg font-semibold text-text" data-test="pp-rating">
          <Star class="w-4 h-4 text-warning" /> {{ ratingLabel }}
        </p>
        <p class="text-xs text-text-muted">Note moyenne</p>
      </div>
    </div>
  </div>
</template>
