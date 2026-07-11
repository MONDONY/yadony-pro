<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import CommandPalette from '@/features/search/components/CommandPalette.vue'
import { useGlobalSearch } from '@/features/search/composables/useGlobalSearch'

const route = useRoute()
const meta = computed(() => ({
  title: (route.meta.pageTitle as string) ?? 'dony PRO',
  subtitle: route.meta.pageSubtitle as string | undefined,
}))

const { toggle: toggleSearch } = useGlobalSearch()

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    toggleSearch()
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <AppSidebar />
    <div class="flex-1 flex flex-col min-w-0">
      <AppTopbar :title="meta.title" :subtitle="meta.subtitle" />
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
    <CommandPalette />
  </div>
</template>
