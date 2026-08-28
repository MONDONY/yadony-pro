<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import CommandPalette from '@/features/search/components/CommandPalette.vue'
import SubscriptionBanner from '@/features/abonnement/components/SubscriptionBanner.vue'
import { useGlobalSearch } from '@/features/search/composables/useGlobalSearch'
import { useSubscription } from '@/features/abonnement/composables/useSubscription'

const route = useRoute()
const meta = computed(() => ({
  title: (route.meta.pageTitle as string) ?? 'yadony PRO',
  subtitle: route.meta.pageSubtitle as string | undefined,
}))

const { toggle: toggleSearch } = useGlobalSearch()
// Chargé une seule fois par montage du layout : les pages qui l'utilisent
// sont toutes protégées par le middleware pro-only, l'utilisateur est donc
// forcément authentifié à ce stade. Le composant sait déjà se taire tant
// qu'il n'y a pas lieu d'alerter (statut ACTIVE, pas de grâce proche).
const { subscription, fetchSubscription } = useSubscription()

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    toggleSearch()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  fetchSubscription()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <AppSidebar />
    <div class="flex-1 flex flex-col min-w-0">
      <AppTopbar :title="meta.title" :subtitle="meta.subtitle" />
      <SubscriptionBanner :subscription="subscription" class="mx-4 mt-4 sm:mx-6 sm:mt-6" />
      <main class="flex-1 overflow-y-auto p-4 sm:p-6">
        <slot />
      </main>
    </div>
    <CommandPalette />
  </div>
</template>
