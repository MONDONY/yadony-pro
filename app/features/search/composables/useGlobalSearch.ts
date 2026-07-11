// app/features/search/composables/useGlobalSearch.ts
import { ref, computed, watch } from 'vue'
import { searchService } from '@/features/search/services/searchService'
import { NAV_SHORTCUTS } from '@/features/search/types/index'
import type { GlobalSearchResults, SearchResultItem } from '@/features/search/types/index'

const DEBOUNCE_MS = 250
const MIN_QUERY_LENGTH = 2

const EMPTY_RESULTS: GlobalSearchResults = { colis: [], trajets: [], tracking: null }

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// State module-level : la palette (composant) et le layout (raccourci clavier)
// partagent la même instance.
const isOpen = ref(false)
const query = ref('')
const results = ref<GlobalSearchResults>(EMPTY_RESULTS)
const isLoading = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let searchSeq = 0 // ignore les réponses obsolètes (frappe rapide)
let watcherInstalled = false

export function useGlobalSearch() {
  const svc = searchService()

  if (!watcherInstalled) {
    watcherInstalled = true
    watch(query, (q) => {
      if (debounceTimer) clearTimeout(debounceTimer)
      const trimmed = q.trim()
      if (trimmed.length < MIN_QUERY_LENGTH) {
        results.value = EMPTY_RESULTS
        isLoading.value = false
        return
      }
      debounceTimer = setTimeout(async () => {
        const seq = ++searchSeq
        isLoading.value = true
        try {
          const res = await svc.searchAll(trimmed)
          if (seq === searchSeq) results.value = res
        } finally {
          if (seq === searchSeq) isLoading.value = false
        }
      }, DEBOUNCE_MS)
    })
  }

  const navShortcuts = computed<SearchResultItem[]>(() => {
    const q = normalize(query.value.trim())
    if (!q) return NAV_SHORTCUTS
    return NAV_SHORTCUTS.filter((n) => normalize(n.title).includes(q))
  })

  function open(): void {
    isOpen.value = true
  }

  function close(): void {
    isOpen.value = false
    query.value = ''
    results.value = EMPTY_RESULTS
  }

  function toggle(): void {
    if (isOpen.value) close()
    else open()
  }

  return { isOpen, query, results, isLoading, navShortcuts, open, close, toggle }
}
