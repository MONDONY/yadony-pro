<!-- app/features/colis/components/BidFilters.vue -->
<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { BidFilter, BidFiltersState } from '@/features/colis/types/index'

const props = defineProps<{
  modelValue: BidFiltersState
  availableTrips: Array<{ id: string; tripCorridor: string }>
}>()

const emit = defineEmits<{
  'update:statusFilter': [value: BidFilter]
  'update:tripId': [value: string | null]
  'update:senderSearch': [value: string]
  'update:dateFrom': [value: string | null]
  'update:dateTo': [value: string | null]
}>()

const statusFilters: Array<{ key: BidFilter; label: string }> = [
  { key: 'TOUS', label: 'Tous' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'ACCEPTED', label: 'Acceptés' },
  { key: 'IN_TRANSIT', label: 'En transit' },
  { key: 'DELIVERED', label: 'Livrés' },
  { key: 'REFUSED', label: 'Refusés' },
  { key: 'DISPUTE', label: 'Litiges' },
]
</script>

<template>
  <div class="space-y-3">
    <!-- Status tabs -->
    <div class="flex items-center gap-1 bg-surface rounded-btn p-1 border border-border overflow-x-auto" role="tablist">
      <button
        v-for="f in statusFilters"
        :key="f.key"
        role="tab"
        :aria-selected="modelValue.statusFilter === f.key"
        :data-test="`filter-status-${f.key}`"
        :class="cn(
          'flex-shrink-0 px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap',
          modelValue.statusFilter === f.key
            ? 'bg-primary text-white shadow-sm'
            : 'text-text-muted hover:text-text',
        )"
        @click="emit('update:statusFilter', f.key)"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Second row: trip selector + date range + sender search -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Trip dropdown -->
      <select
        data-test="filter-trip"
        :value="modelValue.tripId ?? ''"
        class="h-9 px-3 rounded-btn bg-surface border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors min-w-[180px]"
        @change="emit('update:tripId', ($event.target as HTMLSelectElement).value || null)"
      >
        <option value="">Tous les trajets</option>
        <option
          v-for="trip in availableTrips"
          :key="trip.id"
          :value="trip.id"
        >
          {{ trip.tripCorridor }}
        </option>
      </select>

      <!-- Date from -->
      <input
        type="date"
        data-test="filter-date-from"
        :value="modelValue.dateFrom ?? ''"
        class="h-9 px-3 rounded-btn bg-surface border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
        placeholder="Depuis"
        @change="emit('update:dateFrom', ($event.target as HTMLInputElement).value || null)"
      />

      <!-- Date to -->
      <input
        type="date"
        data-test="filter-date-to"
        :value="modelValue.dateTo ?? ''"
        class="h-9 px-3 rounded-btn bg-surface border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
        placeholder="Jusqu'au"
        @change="emit('update:dateTo', ($event.target as HTMLInputElement).value || null)"
      />

      <!-- Sender search -->
      <div class="relative flex-1 min-w-[200px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="text"
          data-test="filter-sender-search"
          :value="modelValue.senderSearch"
          placeholder="Rechercher un expéditeur…"
          class="w-full h-9 pl-9 pr-3 rounded-btn bg-surface border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          @input="emit('update:senderSearch', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </div>
</template>
