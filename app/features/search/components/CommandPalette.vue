<!-- app/features/search/components/CommandPalette.vue -->
<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Package, Route, ScanLine, ArrowRight, Loader2 } from 'lucide-vue-next'
import { useGlobalSearch } from '@/features/search/composables/useGlobalSearch'
import type { SearchResultItem } from '@/features/search/types/index'

const { isOpen, query, results, isLoading, navShortcuts, close } = useGlobalSearch()
const router = useRouter()

const inputRef = ref<HTMLInputElement | null>(null)
const selectedIndex = ref(0)

interface Section {
  key: string
  label: string
  items: SearchResultItem[]
}

const sections = computed<Section[]>(() => {
  const out: Section[] = []
  if (results.value.tracking) out.push({ key: 'tracking', label: 'Code de suivi', items: [results.value.tracking] })
  if (results.value.colis.length) out.push({ key: 'colis', label: 'Colis', items: results.value.colis })
  if (results.value.trajets.length) out.push({ key: 'trajets', label: 'Trajets', items: results.value.trajets })
  if (navShortcuts.value.length) out.push({ key: 'navigation', label: 'Aller à…', items: navShortcuts.value })
  return out
})

const flatItems = computed<SearchResultItem[]>(() => sections.value.flatMap((s) => s.items))

const isEmpty = computed(
  () => !isLoading.value && flatItems.value.length === 0 && query.value.trim().length > 0,
)

// Reset de la sélection à chaque changement de liste, focus à l'ouverture.
watch(flatItems, () => {
  selectedIndex.value = 0
})
watch(isOpen, async (open) => {
  if (open) {
    selectedIndex.value = 0
    await nextTick()
    inputRef.value?.focus()
  }
})

function goTo(item: SearchResultItem) {
  router.push(item.to)
  close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, flatItems.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = flatItems.value[selectedIndex.value]
    if (item) goTo(item)
  }
}

function flatIndexOf(item: SearchResultItem): number {
  return flatItems.value.indexOf(item)
}

const SECTION_ICONS = { tracking: ScanLine, colis: Package, trajets: Route, navigation: ArrowRight } as const
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
      data-test="command-palette"
      @click.self="close()"
    >
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close()" />
      <div class="relative w-full max-w-lg rounded-card border border-border bg-surface shadow-pop overflow-hidden">
        <!-- Champ de recherche -->
        <div class="flex items-center gap-2.5 border-b border-border px-4">
          <Search class="w-4 h-4 text-text-subtle flex-shrink-0" />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            placeholder="Rechercher un colis, un trajet, un code de suivi…"
            data-test="palette-input"
            class="w-full h-12 bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
            @keydown="onKeydown"
          />
          <Loader2 v-if="isLoading" class="w-4 h-4 text-text-subtle animate-spin flex-shrink-0" />
          <kbd class="hidden sm:block text-2xs text-text-subtle border border-border rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <!-- Résultats -->
        <div class="max-h-[50vh] overflow-y-auto p-2">
          <p v-if="isEmpty" class="py-8 text-center text-sm text-text-muted" data-test="palette-empty">
            Aucun résultat pour « {{ query.trim() }} »
          </p>

          <template v-for="section in sections" :key="section.key">
            <p class="px-2 pt-2 pb-1 text-2xs font-semibold uppercase tracking-[0.12em] text-text-subtle">
              {{ section.label }}
            </p>
            <button
              v-for="item in section.items"
              :key="item.id"
              :data-test="`palette-item-${item.id}`"
              :class="[
                'w-full flex items-center gap-3 px-2.5 py-2 rounded-btn text-left transition-colors',
                flatIndexOf(item) === selectedIndex ? 'bg-primary/10 text-text' : 'text-text-muted hover:bg-surface-el hover:text-text',
              ]"
              @mouseenter="selectedIndex = flatIndexOf(item)"
              @click="goTo(item)"
            >
              <component :is="SECTION_ICONS[item.type]" class="w-4 h-4 flex-shrink-0 text-text-subtle" />
              <span class="min-w-0 flex-1">
                <span class="block text-sm truncate">{{ item.title }}</span>
                <span v-if="item.subtitle" class="block text-xs text-text-subtle truncate">{{ item.subtitle }}</span>
              </span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
