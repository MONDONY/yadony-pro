<script setup lang="ts">
import { onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/features/notifications/composables/useNotifications'
import NotificationItem from '@/features/notifications/components/NotificationItem.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Notifications',
  pageSubtitle: 'Colis, négociations, paiements et alertes',
})

const {
  notifications,
  unread,
  isLoading,
  error,
  last,
  fetchFirstPage,
  loadMore,
  refreshUnread,
  markRead,
  markAllRead,
  remove,
} = useNotifications()

onMounted(() => {
  fetchFirstPage()
  refreshUnread()
})
</script>

<template>
  <div class="max-w-2xl space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-text-muted" data-test="notif-unread">
        {{ unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour' }}
      </p>
      <Button
        v-if="unread > 0"
        type="button"
        variant="outline"
        size="sm"
        data-test="notif-mark-all"
        @click="markAllRead"
      >
        Tout marquer comme lu
      </Button>
    </div>

    <section class="bg-surface border border-border rounded-card p-3">
      <p v-if="error" class="py-2 px-3 text-sm text-danger" data-test="notif-error">{{ error }}</p>

      <div v-if="isLoading && notifications.length === 0" class="py-8 text-center text-sm text-text-muted" data-test="notif-loading">
        Chargement…
      </div>

      <p
        v-else-if="notifications.length === 0"
        class="py-8 text-center text-sm text-text-muted"
        data-test="notif-empty"
      >
        Aucune notification pour le moment.
      </p>

      <div v-else class="divide-y divide-border">
        <NotificationItem
          v-for="n in notifications"
          :key="n.id"
          :notification="n"
          @read="markRead"
          @remove="remove"
        />
      </div>

      <div v-if="!last" class="pt-3 text-center">
        <Button type="button" variant="ghost" size="sm" data-test="notif-load-more" :disabled="isLoading" @click="loadMore">
          Charger plus
        </Button>
      </div>
    </section>
  </div>
</template>
