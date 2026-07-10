<script setup lang="ts">
import { Luggage, Plus, ArrowDown } from 'lucide-vue-next'
import { EmptyState } from '@/components/ui/empty-state'

defineProps<{
  totalOpenRequests?: number  // nombre de demandes ouvertes à explorer (optionnel)
}>()
</script>

<template>
  <EmptyState
    :icon="Luggage"
    title="Crée ton premier trajet"
    description="Les demandes compatibles apparaissent ici dès que tu as un trajet actif. Tu peux aussi explorer les demandes et créer un trajet depuis une demande qui t'intéresse."
  >
    <div class="flex flex-col items-center">
      <NuxtLink
        data-test="empty-create-trip-btn"
        to="/trajets/nouvelle-annonce"
        class="inline-flex items-center gap-1.5 bg-primary text-on-primary text-sm font-semibold px-5 py-2.5 rounded-btn shadow-btn hover:bg-primary-hover transition-colors"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />
        Créer un trajet
      </NuxtLink>
      <div v-if="totalOpenRequests && totalOpenRequests > 0" class="mt-5 pt-5 border-t border-border w-full max-w-xs">
        <p class="inline-flex items-center gap-1 text-xs text-text-muted">
          ou explore les
          <span class="font-semibold text-text font-mono tabular-nums">{{ totalOpenRequests }}</span>
          demandes ouvertes
          <ArrowDown class="h-3 w-3" aria-hidden="true" />
        </p>
      </div>
    </div>
  </EmptyState>
</template>
