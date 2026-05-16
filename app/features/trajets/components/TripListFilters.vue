<!-- app/features/trajets/components/TripListFilters.vue -->
<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { TripFilter, DateMode, CorridorOption } from '@/features/trajets/types/index'

const props = defineProps<{
  modelValue: TripFilter
  search: string
  dateMode: DateMode
  date: string | null
  dateFrom: string | null
  dateTo: string | null
  corridor: CorridorOption | null
  corridors: CorridorOption[]
  counts?: Partial<Record<TripFilter, number>>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TripFilter]
  'update:search': [value: string]
  'update:dateMode': [value: DateMode]
  'update:date': [value: string | null]
  'update:dateFrom': [value: string | null]
  'update:dateTo': [value: string | null]
  'update:corridor': [value: CorridorOption | null]
}>()

const statusFilters: Array<{ key: TripFilter; label: string }> = [
  { key: 'TOUS', label: 'Tous' },
  { key: 'ACTIFS', label: 'Actifs' },
  { key: 'COMPLETS', label: 'Complets' },
  { key: 'EN_COURS', label: 'En cours' },
  { key: 'TERMINES', label: 'Terminés' },
  { key: 'ANNULES', label: 'Annulés' },
]

const dateModes: Array<{ key: DateMode; label: string }> = [
  { key: 'none', label: 'Toutes dates' },
  { key: 'day', label: 'Jour' },
  { key: 'period', label: 'Période' },
]

function corridorLabel(c: CorridorOption): string {
  return `${c.departure} → ${c.arrival}`
}

function onCorridorChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  if (!val) {
    emit('update:corridor', null)
    return
  }
  const [dep, arr] = val.split('||')
  emit('update:corridor', { departure: dep, arrival: arr })
}

function corridorValue(c: CorridorOption | null): string {
  return c ? `${c.departure}||${c.arrival}` : ''
}
</script>

<template>
  <div class="space-y-3">
    <!-- Status tabs -->
    <div class="flex items-center gap-1 bg-surface rounded-btn p-1 border border-border overflow-x-auto" role="tablist">
      <button
        v-for="f in statusFilters"
        :key="f.key"
        role="tab"
        :aria-selected="modelValue === f.key"
        :data-test="`filter-${f.key}`"
        :class="cn(
          'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap',
          modelValue === f.key
            ? 'bg-primary text-white shadow-sm'
            : 'text-text-muted hover:text-text',
        )"
        @click="emit('update:modelValue', f.key)"
      >
        {{ f.label }}
        <span
          v-if="counts?.[f.key] !== undefined && counts[f.key]! > 0"
          :class="cn(
            'text-xs px-1.5 py-0.5 rounded-full font-semibold min-w-[18px] text-center',
            modelValue === f.key ? 'bg-white/20 text-white' : 'bg-border text-text-muted',
          )"
        >
          {{ counts[f.key] }}
        </span>
      </button>
    </div>

    <!-- Corridor + Search row -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Corridor dropdown -->
      <select
        data-test="filter-corridor"
        :value="corridorValue(corridor)"
        class="h-9 px-3 rounded-btn bg-surface border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors min-w-[200px]"
        @change="onCorridorChange"
      >
        <option value="">Tous les corridors</option>
        <option
          v-for="c in corridors"
          :key="`${c.departure}||${c.arrival}`"
          :value="`${c.departure}||${c.arrival}`"
        >
          {{ corridorLabel(c) }}
        </option>
      </select>

      <!-- Search -->
      <div class="relative flex-1 min-w-[200px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="text"
          data-test="filter-search"
          :value="search"
          placeholder="Rechercher par ville (Paris, Dakar…)"
          class="w-full h-9 pl-9 pr-3 rounded-btn bg-surface border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          @input="emit('update:search', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- Date filter row -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Date mode toggle -->
      <div class="flex items-center gap-1 bg-surface border border-border rounded-btn p-1">
        <button
          v-for="m in dateModes"
          :key="m.key"
          :data-test="`filter-date-mode-${m.key}`"
          :class="cn(
            'px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap',
            dateMode === m.key
              ? 'bg-primary text-white'
              : 'text-text-muted hover:text-text',
          )"
          @click="emit('update:dateMode', m.key)"
        >
          {{ m.label }}
        </button>
      </div>

      <!-- Single day input -->
      <template v-if="dateMode === 'day'">
        <div class="relative flex items-center">
          <input
            type="date"
            data-test="filter-date"
            :value="date ?? ''"
            class="h-9 pl-3 pr-8 rounded-btn bg-surface border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
            @change="emit('update:date', ($event.target as HTMLInputElement).value || null)"
          />
          <button
            v-if="date"
            class="absolute right-2 text-text-muted hover:text-text transition-colors"
            type="button"
            @click="emit('update:date', null)"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>

      <!-- Date range inputs -->
      <template v-if="dateMode === 'period'">
        <div class="flex items-center gap-2">
          <div class="relative flex items-center">
            <input
              type="date"
              data-test="filter-date-from"
              :value="dateFrom ?? ''"
              class="h-9 pl-3 pr-8 rounded-btn bg-surface border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
              @change="emit('update:dateFrom', ($event.target as HTMLInputElement).value || null)"
            />
            <button
              v-if="dateFrom"
              class="absolute right-2 text-text-muted hover:text-text transition-colors"
              type="button"
              @click="emit('update:dateFrom', null)"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <span class="text-xs text-text-muted">→</span>
          <div class="relative flex items-center">
            <input
              type="date"
              data-test="filter-date-to"
              :value="dateTo ?? ''"
              :min="dateFrom ?? ''"
              class="h-9 pl-3 pr-8 rounded-btn bg-surface border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
              @change="emit('update:dateTo', ($event.target as HTMLInputElement).value || null)"
            />
            <button
              v-if="dateTo"
              class="absolute right-2 text-text-muted hover:text-text transition-colors"
              type="button"
              @click="emit('update:dateTo', null)"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
