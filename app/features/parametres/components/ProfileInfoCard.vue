<!-- app/features/parametres/components/ProfileInfoCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const props = defineProps<{
  displayName: string | null
  phoneNumber: string | null
  isProAccount: boolean
  roles: string[]
}>()

const initials = computed(() =>
  (props.displayName ?? '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const roleLabels = computed(() =>
  props.roles.map((r) => r.replace(/^ROLE_/, '').toLowerCase()),
)
</script>

<template>
  <div class="bg-surface border border-border rounded-card p-5 flex items-center gap-4" data-test="profile-info">
    <Avatar class="h-14 w-14">
      <AvatarFallback class="bg-primary text-white text-lg">{{ initials }}</AvatarFallback>
    </Avatar>
    <div class="flex-1 min-w-0">
      <p class="font-display font-semibold text-lg text-text truncate" data-test="profile-name">
        {{ displayName ?? 'Voyageur' }}
      </p>
      <p v-if="phoneNumber" class="text-sm text-text-muted" data-test="profile-phone">{{ phoneNumber }}</p>
      <div class="flex items-center gap-2 mt-1.5">
        <span
          v-if="isProAccount"
          class="text-xs font-semibold bg-accent/20 text-accent px-2 py-0.5 rounded"
          data-test="profile-pro-badge"
        >PRO</span>
        <span
          v-for="role in roleLabels"
          :key="role"
          class="text-xs bg-surface-elevated text-text-muted px-2 py-0.5 rounded capitalize"
        >{{ role }}</span>
      </div>
    </div>
  </div>
</template>
