import { useApi } from '@/composables/useApi'
import type { NotificationPage } from '@/features/notifications/types/index'

export function notificationsService() {
  const api = useApi()

  async function list(page = 0, size = 30): Promise<NotificationPage> {
    return api<NotificationPage>('/notifications', { query: { page, size } })
  }

  async function unreadCount(): Promise<number> {
    const result = await api<{ count: number }>('/notifications/unread-count')
    return result.count
  }

  async function markRead(id: string): Promise<void> {
    await api(`/notifications/${id}/read`, { method: 'PATCH' })
  }

  async function markAllRead(): Promise<void> {
    await api('/notifications/read-all', { method: 'PATCH' })
  }

  async function remove(id: string): Promise<void> {
    await api(`/notifications/${id}`, { method: 'DELETE' })
  }

  return { list, unreadCount, markRead, markAllRead, remove }
}
