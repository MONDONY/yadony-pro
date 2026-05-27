<script setup lang="ts">
import {
  Home,
  Plane,
  Package,
  Bot,
  MessageSquareDot,
  Search,
  BarChart3,
  Tags,
  Bell,
  Settings,
  Plus,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth'
import NavItem from './NavItem.vue'

const auth = useAuthStore()
const initials = computed(() =>
  auth.user?.displayName?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() ?? '?',
)
</script>

<template>
  <aside class="w-sidebar shrink-0 bg-surface border-r border-border flex flex-col">
    <!-- Logo -->
    <div class="px-6 py-5 border-b border-border">
      <NuxtLink to="/cockpit" class="font-display font-bold text-xl text-primary">
        dony <span class="text-text">PRO</span>
      </NuxtLink>
    </div>

    <!-- User — ClientOnly évite le mismatch d'hydratation (auth non dispo côté SSR) -->
    <ClientOnly>
      <div class="px-4 py-4 border-b border-border flex items-center gap-3">
        <Avatar>
          <AvatarFallback class="bg-primary text-white text-sm">{{ initials }}</AvatarFallback>
        </Avatar>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ auth.user?.displayName }}</p>
          <span class="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded">PRO</span>
        </div>
      </div>
      <template #fallback>
        <div class="px-4 py-4 border-b border-border flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary/20 animate-pulse" />
          <div class="flex-1 space-y-1">
            <div class="h-3 bg-border rounded w-24 animate-pulse" />
            <div class="h-3 bg-border rounded w-8 animate-pulse" />
          </div>
        </div>
      </template>
    </ClientOnly>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <NavItem to="/cockpit" label="Centre de commandes">
        <template #icon><Home class="w-4 h-4" /></template>
      </NavItem>
      <NavItem to="/trajets" label="Mes Trajets">
        <template #icon><Plane class="w-4 h-4" /></template>
      </NavItem>
      <NavItem to="/colis" label="Mes Colis">
        <template #icon><Package class="w-4 h-4" /></template>
      </NavItem>
      <NavItem to="/automatisations" label="Automatisations">
        <template #icon><Bot class="w-4 h-4" /></template>
      </NavItem>
      <NavItem to="/negociations" label="Négociations">
        <template #icon><MessageSquareDot class="w-4 h-4" /></template>
      </NavItem>
      <NavItem to="/demandes" label="Demandes compatibles">
        <template #icon><Search class="w-4 h-4" /></template>
      </NavItem>
      <NavItem to="/activite" label="Mon Activité">
        <template #icon><BarChart3 class="w-4 h-4" /></template>
      </NavItem>
      <NavItem to="/tarifs" label="Grille tarifaire">
        <template #icon><Tags class="w-4 h-4" /></template>
      </NavItem>
      <NavItem to="/notifications" label="Notifications">
        <template #icon><Bell class="w-4 h-4" /></template>
      </NavItem>
      <NavItem to="/parametres" label="Paramètres">
        <template #icon><Settings class="w-4 h-4" /></template>
      </NavItem>
    </nav>

    <!-- CTA -->
    <div class="p-3 border-t border-border">
      <NuxtLink
        to="/trajets/nouvelle-annonce"
        data-test="btn-nouvelle-annonce"
        class="flex items-center justify-center gap-2 w-full rounded-md bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-primary/90 transition-colors"
      >
        <Plus class="w-4 h-4" />
        Nouvelle annonce
      </NuxtLink>
    </div>
  </aside>
</template>
