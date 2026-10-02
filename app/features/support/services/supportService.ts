// app/features/support/services/supportService.ts
import { useApi } from '@/composables/useApi'
import type {
  CreateSupportTicketPayload, SupportMessage, SupportPredefinedReply, SupportTicket, SupportTicketPage,
} from '@/features/support/types/index'

export function supportService() {
  const api = useApi()

  async function listTickets(page = 0, size = 20): Promise<SupportTicketPage> {
    return api<SupportTicketPage>('/support/tickets', { query: { page, size } })
  }

  async function getTicket(id: string): Promise<SupportTicket> {
    return api<SupportTicket>(`/support/tickets/${id}`)
  }

  async function createTicket(payload: CreateSupportTicketPayload): Promise<SupportTicket> {
    return api<SupportTicket>('/support/tickets', { method: 'POST', body: payload })
  }

  async function reply(ticketId: string, content: string): Promise<SupportMessage> {
    return api<SupportMessage>(`/support/tickets/${ticketId}/messages`, { method: 'POST', body: { content } })
  }

  async function markRead(ticketId: string): Promise<void> {
    await api<void>(`/support/tickets/${ticketId}/read`, { method: 'POST' })
  }

  /** Questions fréquentes, déjà traduites dans la langue du compte. */
  async function listReplies(): Promise<SupportPredefinedReply[]> {
    return api<SupportPredefinedReply[]>('/support/replies')
  }

  async function unreadCount(): Promise<number> {
    const res = await api<{ count: number }>('/support/unread-count')
    return Number(res.count) || 0
  }

  return { listTickets, getTicket, createTicket, reply, markRead, listReplies, unreadCount }
}
