import { useApi } from '@/composables/useApi'
import type { Conversation, ConversationPage } from '@/features/messagerie/types/index'

export function conversationsService() {
  const api = useApi()

  async function list(page = 0, size = 20): Promise<ConversationPage> {
    return api<ConversationPage>('/conversations', { query: { page, size } })
  }

  async function getById(id: string): Promise<Conversation> {
    return api<Conversation>(`/conversations/${id}`)
  }

  /** Conversation voyageur ↔ destinataire d'un colis (le destinataire doit avoir confirmé son lien). */
  async function getRecipientConversation(bidId: string): Promise<Conversation> {
    return api<Conversation>(`/conversations/bid/${bidId}/recipient`)
  }

  async function updateLastMessage(id: string, preview: string): Promise<void> {
    await api(`/conversations/${id}/last-message`, { method: 'POST', body: { preview } })
  }

  async function archive(id: string): Promise<void> {
    await api(`/conversations/${id}/archive`, { method: 'POST' })
  }

  async function unarchive(id: string): Promise<void> {
    await api(`/conversations/${id}/unarchive`, { method: 'POST' })
  }

  return { list, getById, getRecipientConversation, updateLastMessage, archive, unarchive }
}
