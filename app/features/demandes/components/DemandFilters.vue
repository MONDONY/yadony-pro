<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { LayoutGrid, List, Weight, Euro, Package, ArrowDownNarrowWide, Star, Clock, TrendingUp } from 'lucide-vue-next'
import type { FilterState } from '@/features/demandes/types/index'
import { DEFAULT_FILTER_STATE } from '@/features/demandes/types/index'

const props = defineProps<{
  filters: FilterState
  resultCount: number
  availableContentTypes: string[]
  viewMode: 'card' | 'list'
}>()

const emit = defineEmits<{
  'update:filters': [value: FilterState]
  'update:viewMode': [value: 'card' | 'list']
}>()

const openPicker = ref<'weight' | 'budget' | 'type' | 'sort' | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const hasActiveFilter = computed(() =>
  props.filters.maxWeightKg !== null ||
  props.filters.minBudgetPerKg !== null ||
  props.filters.contentType !== null ||
  props.filters.sortBy !== 'score',
)

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    openPicker.value = null
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') openPicker.value = null
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})

function resetAll() {
  emit('update:filters', { ...DEFAULT_FILTER_STATE })
}

function patch(partial: Partial<FilterState>) {
  emit('update:filters', { ...props.filters, ...partial })
  openPicker.value = null
}

const weightOptions = [5, 10, 15, 20]
const budgetOptions = [5, 8, 10, 15]
const sortOptions: { value: FilterState['sortBy']; label: string; icon: typeof Star }[] = [
  { value: 'score', label: 'Score', icon: Star },
  { value: 'date', label: 'Récent', icon: Clock },
  { value: 'price', label: 'Prix élevé', icon: TrendingUp },
]
const currentSort = computed(() => sortOptions.find(s => s.value === props.filters.sortBy) ?? sortOptions[0])
</script>

<template>
  <div ref="containerRef" class="px-4 py-2.5 border-b border-border flex items-center gap-2 flex-wrap">
    <!-- Chip Tous -->
    <button
      data-test="filter-all"
      :class="[
        'shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors',
        !hasActiveFilter ? 'bg-text text-bg' : 'bg-surface border border-border text-text-muted hover:text-text',
      ]"
      type="button"
      @click="resetAll"
    >
      Tous (<span class="font-mono tabular-nums">{{ resultCount }}</span>)
    </button>

    <!-- Chip Poids -->
    <div class="relative shrink-0">
      <button
        data-test="filter-weight"
        :class="[
          'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors',
          filters.maxWeightKg !== null ? 'bg-text text-bg' : 'bg-surface border border-border text-text-muted hover:text-text',
        ]"
        type="button"
        @click="openPicker = openPicker === 'weight' ? null : 'weight'"
      >
        <Weight class="h-3.5 w-3.5" aria-hidden="true" />
        <span :class="filters.maxWeightKg !== null ? 'font-mono tabular-nums' : ''">{{ filters.maxWeightKg !== null ? `< ${filters.maxWeightKg} kg` : 'Poids' }}</span>
      </button>
      <div v-if="openPicker === 'weight'" class="absolute top-full left-0 mt-1 bg-surface border border-border rounded-el shadow-pop z-20 py-1 min-w-24">
        <button
          v-for="w in weightOptions"
          :key="w"
          :data-test="`weight-option-${w}`"
          class="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-el transition-colors text-text font-mono tabular-nums"
          type="button"
          @click="patch({ maxWeightKg: w })"
        >
          &lt; {{ w }} kg
        </button>
        <button
          v-if="filters.maxWeightKg !== null"
          class="w-full text-left px-3 py-1.5 text-xs text-text-muted hover:bg-surface-el border-t border-border transition-colors"
          type="button"
          @click="patch({ maxWeightKg: null })"
        >Effacer</button>
      </div>
    </div>

    <!-- Chip Budget -->
    <div class="relative shrink-0">
      <button
        data-test="filter-budget"
        :class="[
          'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors',
          filters.minBudgetPerKg !== null ? 'bg-text text-bg' : 'bg-surface border border-border text-text-muted hover:text-text',
        ]"
        type="button"
        @click="openPicker = openPicker === 'budget' ? null : 'budget'"
      >
        <Euro class="h-3.5 w-3.5" aria-hidden="true" />
        <span :class="filters.minBudgetPerKg !== null ? 'font-mono tabular-nums' : ''">{{ filters.minBudgetPerKg !== null ? `> ${filters.minBudgetPerKg} €/kg` : '€/kg min' }}</span>
      </button>
      <div v-if="openPicker === 'budget'" class="absolute top-full left-0 mt-1 bg-surface border border-border rounded-el shadow-pop z-20 py-1 min-w-28">
        <button
          v-for="b in budgetOptions"
          :key="b"
          :data-test="`budget-option-${b}`"
          class="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-el transition-colors text-text font-mono tabular-nums"
          type="button"
          @click="patch({ minBudgetPerKg: b })"
        >
          &gt; {{ b }} €/kg
        </button>
        <button
          v-if="filters.minBudgetPerKg !== null"
          class="w-full text-left px-3 py-1.5 text-xs text-text-muted hover:bg-surface-el border-t border-border transition-colors"
          type="button"
          @click="patch({ minBudgetPerKg: null })"
        >Effacer</button>
      </div>
    </div>

    <!-- Chip Type -->
    <div v-if="availableContentTypes.length > 0" class="relative shrink-0">
      <button
        data-test="filter-type"
        :class="[
          'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors',
          filters.contentType !== null ? 'bg-text text-bg' : 'bg-surface border border-border text-text-muted hover:text-text',
        ]"
        type="button"
        @click="openPicker = openPicker === 'type' ? null : 'type'"
      >
        <Package class="h-3.5 w-3.5" aria-hidden="true" />
        {{ filters.contentType ?? 'Type' }}
      </button>
      <div v-if="openPicker === 'type'" class="absolute top-full left-0 mt-1 bg-surface border border-border rounded-el shadow-pop z-20 py-1 min-w-32">
        <button
          v-for="ct in availableContentTypes"
          :key="ct"
          :data-test="`type-option-${ct}`"
          class="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-el transition-colors text-text"
          type="button"
          @click="patch({ contentType: ct })"
        >{{ ct }}</button>
        <button
          v-if="filters.contentType !== null"
          class="w-full text-left px-3 py-1.5 text-xs text-text-muted hover:bg-surface-el border-t border-border transition-colors"
          type="button"
          @click="patch({ contentType: null })"
        >Effacer</button>
      </div>
    </div>

    <!-- Chip Tri -->
    <div class="relative shrink-0">
      <button
        data-test="filter-sort"
        class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-surface border border-border text-text-muted hover:text-text transition-colors"
        type="button"
        @click="openPicker = openPicker === 'sort' ? null : 'sort'"
      >
        <ArrowDownNarrowWide class="h-3.5 w-3.5" aria-hidden="true" />
        {{ currentSort.label }}
      </button>
      <div v-if="openPicker === 'sort'" class="absolute top-full left-0 mt-1 bg-surface border border-border rounded-el shadow-pop z-20 py-1 min-w-32">
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          :data-test="`sort-option-${opt.value}`"
          class="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-el transition-colors text-text inline-flex w-full items-center gap-2"
          type="button"
          @click="patch({ sortBy: opt.value })"
        ><component :is="opt.icon" class="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />{{ opt.label }}</button>
      </div>
    </div>

    <!-- Séparateur + toggle vue -->
    <div class="ml-auto flex items-center gap-0.5 bg-bg border border-border rounded-btn p-0.5">
      <button
        :class="['p-1.5 rounded transition-colors', viewMode === 'card' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text']"
        type="button"
        aria-label="Vue cartes"
        @click="emit('update:viewMode', 'card')"
      >
        <LayoutGrid class="w-3.5 h-3.5" />
      </button>
      <button
        :class="['p-1.5 rounded transition-colors', viewMode === 'list' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text']"
        type="button"
        aria-label="Vue liste"
        @click="emit('update:viewMode', 'list')"
      >
        <List class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>
