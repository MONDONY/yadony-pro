import { ref } from 'vue'
import { notificationsService } from '@/features/notifications/services/notificationsService'
import type { AppNotification } from '@/features/notifications/types/index'

const PAGE_SIZE = 30

export function useNotifications() {
  const notifications = ref<AppNotification[]>([])
  const unread = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const page = ref(0)
  const last = ref(true)

  const svc = notificationsService()

  async function fetchFirstPage(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const result = await svc.list(0, PAGE_SIZE)
      notifications.value = result.content
      page.value = result.page
      last.value = result.last
    } catch {
      error.value = 'Impossible de charger tes notifications.'
    } finally {
      isLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (last.value || isLoading.value) return
    isLoading.value = true
    try {
      const result = await svc.list(page.value + 1, PAGE_SIZE)
      notifications.value = [...notifications.value, ...result.content]
      page.value = result.page
      last.value = result.last
    } catch {
      error.value = 'Impossible de charger plus de notifications.'
    } finally {
      isLoading.value = false
    }
  }

  async function refreshUnread(): Promise<void> {
    try {
      unread.value = await svc.unreadCount()
    } catch {
      /* silencieux — le badge n'est pas critique */
    }
  }

  async function markRead(id: string): Promise<void> {
    const target = notifications.value.find((n) => n.id === id)
    if (!target || target.read) return
    try {
      await svc.markRead(id)
      target.read = true
      unread.value = Math.max(0, unread.value - 1)
    } catch {
      error.value = 'Impossible de marquer comme lue.'
    }
  }

  async function markAllRead(): Promise<void> {
    try {
      await svc.markAllRead()
      notifications.value.forEach((n) => {
        n.read = true
      })
      unread.value = 0
    } catch {
      error.value = 'Impossible de tout marquer comme lu.'
    }
  }

  async function remove(id: string): Promise<void> {
    const target = notifications.value.find((n) => n.id === id)
    try {
      await svc.remove(id)
      notifications.value = notifications.value.filter((n) => n.id !== id)
      if (target && !target.read) unread.value = Math.max(0, unread.value - 1)
    } catch {
      error.value = 'Impossible de supprimer cette notification.'
    }
  }

  return {
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
  }
}
