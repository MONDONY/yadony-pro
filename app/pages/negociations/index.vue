<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { MessageSquareDot, RefreshCw } from 'lucide-vue-next'
import { useNegotiations } from '@/features/negociations/composables/useNegotiations'
import NegotiationCard from '@/features/negociations/components/NegotiationCard.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Mes Négociations',
  pageSubtitle: 'Toutes vos négociations en cours et passées',
})

const { threads, isLoading, error, fetchAll } = useNegotiations()

onMounted(() => fetchAll())

type Tab = 'all' | 'active' | 'done'
const activeTab = ref<Tab>('all')

const ACTIVE_STATUSES = ['OPEN', 'AWAITING_TRIP', 'AWAITING_PAYMENT', 'ACCEPTED']
const DONE_STATUSES = ['REJECTED', 'AUTO_REJECTED', 'EXPIRED']

const activeCount = computed(() => threads.value.filter(t => ACTIVE_STATUSES.includes(t.status)).length)
const doneCount = computed(() => threads.value.filter(t => DONE_STATUSES.includes(t.status)).length)

const visibleThreads = computed(() => {
  if (activeTab.value === 'active') return threads.value.filter(t => ACTIVE_STATUSES.includes(t.status))
  if (activeTab.value === 'done') return threads.value.filter(t => DONE_STATUSES.includes(t.status))
  return threads.value
})

const TABS: { key: Tab; label: string; count?: () => number }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'active', label: 'En cours', count: () => activeCount.value },
  { key: 'done', label: 'Terminées', count: () => doneCount.value },
]
</script>

<template>
  <div class="space-y-4">
    <!-- Tabs + Refresh -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex gap-1 bg-surface border border-border rounded-btn p-0.5">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          class="relative px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors"
          :class="activeTab === tab.key
            ? 'bg-primary text-white shadow-sm'
            : 'text-text-muted hover:text-text'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span
            v-if="tab.count && tab.count() > 0"
            class="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-extrabold rounded-full"
            :class="activeTab === tab.key ? 'bg-white/20' : 'bg-border text-text-muted'"
          >
            {{ tab.count() }}
          </span>
        </button>
      </div>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-border text-xs text-text-muted hover:text-text transition-colors"
        :class="{ 'opacity-50 pointer-events-none': isLoading }"
        @click="fetchAll()"
      >
        <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': isLoading }" />
        Actualiser
      </button>
    </div>

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

    <!-- List -->
    <template v-else>
      <div v-if="visibleThreads.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NegotiationCard v-for="t in visibleThreads" :key="t.id" :thread="t" />
      </div>

      <!-- Empty -->
      <div
        v-else
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
