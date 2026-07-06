<!-- app/features/notifications/components/NotificationItem.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Check, Trash2 } from 'lucide-vue-next'
import type { AppNotification } from '@/features/notifications/types/index'

const props = defineProps<{ notification: AppNotification }>()

const emit = defineEmits<{ read: [id: string]; remove: [id: string] }>()

const formattedDate = computed(() => {
  const d = new Date(props.notification.createdAt)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(d)
})
</script>

<template>
  <div
    class="flex items-start gap-3 py-3 px-3 rounded-btn"
    :class="notification.read ? '' : 'bg-primary/5'"
    :data-test="`notif-${notification.id}`"
  >
    <span
      class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
      :class="notification.read ? 'bg-transparent' : 'bg-primary'"
      data-test="notif-dot"
    />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-text">{{ notification.title }}</p>
      <p class="text-sm text-text-muted">{{ notification.body }}</p>
      <p class="text-xs text-text-muted mt-1">{{ formattedDate }}</p>
    </div>
    <div class="flex items-center gap-1">
      <button
        v-if="!notification.read"
        type="button"
        class="p-1.5 rounded text-text-muted hover:text-primary"
        :data-test="`notif-read-${notification.id}`"
        aria-label="Marquer comme lue"
        @click="emit('read', notification.id)"
      >
        <Check class="w-4 h-4" />
      </button>
      <button
        type="button"
        class="p-1.5 rounded text-text-muted hover:text-danger"
        :data-test="`notif-remove-${notification.id}`"
        aria-label="Supprimer"
        @click="emit('remove', notification.id)"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
