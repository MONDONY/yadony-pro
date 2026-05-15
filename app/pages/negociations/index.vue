<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { MessageSquareDot } from 'lucide-vue-next'
import { useNegotiations } from '@/features/negociations/composables/useNegotiations'
import NegotiationCard from '@/features/negociations/components/NegotiationCard.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Mes Négociations',
  pageSubtitle: 'Toutes vos négociations en cours et passées',
})

const { threads, isLoading, error, fetchAll } = useNegotiations()

onMounted(() => fetchAll())

const activeThreads = computed(() =>
  threads.value.filter(t => ['OPEN', 'AWAITING_TRIP', 'AWAITING_PAYMENT'].includes(t.status)),
)
const pastThreads = computed(() =>
  threads.value.filter(t => !['OPEN', 'AWAITING_TRIP', 'AWAITING_PAYMENT'].includes(t.status)),
)
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 4" :key="i" class="h-36 bg-surface border border-border rounded-card animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center py-16 text-center">
      <p class="text-red-400 font-medium">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 rounded-btn border border-border text-sm text-text-muted hover:text-text"
        @click="fetchAll()"
      >
        Réessayer
      </button>
    </div>

    <template v-else>
      <!-- Actives -->
      <div v-if="activeThreads.length > 0" class="space-y-3">
        <h2 class="text-sm font-semibold text-text-muted uppercase tracking-wider">
          En cours ({{ activeThreads.length }})
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NegotiationCard v-for="t in activeThreads" :key="t.id" :thread="t" />
        </div>
      </div>

      <!-- Passées -->
      <div v-if="pastThreads.length > 0" class="space-y-3">
        <h2 class="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Terminées ({{ pastThreads.length }})
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NegotiationCard v-for="t in pastThreads" :key="t.id" :thread="t" />
        </div>
      </div>

      <!-- Empty -->
      <div
        v-if="threads.length === 0"
        class="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-card text-center"
      >
        <MessageSquareDot class="w-10 h-10 text-text-muted mb-3" />
        <p class="text-text-muted font-medium">Aucune négociation pour l'instant</p>
        <p class="text-xs text-text-muted mt-1.5 max-w-xs">
          Allez dans "Demandes compatibles" pour proposer un prix à un expéditeur.
        </p>
      </div>
    </template>
  </div>
</template>
