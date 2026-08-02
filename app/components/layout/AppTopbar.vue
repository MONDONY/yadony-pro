<script setup lang="ts">
import { Bell, LogOut, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useFirebaseAuth } from '@/features/auth/composables/useFirebaseAuth'
import { useGlobalSearch } from '@/features/search/composables/useGlobalSearch'

defineProps<{ title: string; subtitle?: string }>()

const { open: openSearch } = useGlobalSearch()

async function logout() {
  const { signOut } = useFirebaseAuth()
  await signOut()
}
</script>

<template>
  <header class="h-topbar shrink-0 bg-surface border-b border-border flex items-center justify-between px-6">
    <div>
      <h1 class="font-display text-xl font-bold">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm text-text-muted">{{ subtitle }}</p>
    </div>
    <div class="flex items-center gap-2">
      <button
        data-test="topbar-search"
        class="hidden sm:flex items-center gap-2 h-9 px-3 rounded-btn border border-border text-sm text-text-subtle hover:text-text hover:border-border-strong transition-colors"
        @click="openSearch()"
      >
        <Search class="w-3.5 h-3.5" />
        <span>Rechercher…</span>
        <kbd class="text-2xs border border-border rounded px-1 py-0.5">⌘K</kbd>
      </button>
      <Button variant="ghost" size="icon" class="sm:hidden" data-test="topbar-search-icon" @click="openSearch()">
        <Search class="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Bell class="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" @click="logout">
        <LogOut class="w-4 h-4" />
      </Button>
    </div>
  </header>
</template>
