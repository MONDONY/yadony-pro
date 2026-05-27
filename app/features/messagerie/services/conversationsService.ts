import { useApi } from '@/composables/useApi'
import type { ConversationPage } from '@/features/messagerie/types/index'

export function conversationsService() {
  const api = useApi()

  async function list(page = 0, size = 20): Promise<ConversationPage> {
    return api<ConversationPage>('/conversations', { query: { page, size } })
  }

  async function archive(id: string): Promise<void> {
    await api(`/conversations/${id}/archive`, { method: 'POST' })
  }

  async function unarchive(id: string): Promise<void> {
    await api(`/conversations/${id}/unarchive`, { method: 'POST' })
  }

  return { list, archive, unarchive }
}
