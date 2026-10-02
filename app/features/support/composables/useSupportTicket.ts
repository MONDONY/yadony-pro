// app/features/support/composables/useSupportTicket.ts
import { ref } from 'vue'
import { supportService } from '@/features/support/services/supportService'
import { extractProblem, TECHNICAL_ERROR_PATTERN } from '@/lib/apiError'
import type { SupportTicket } from '@/features/support/types/index'

/** Fil d'une demande de support : lecture (marquée lue) et réponse. */
export function useSupportTicket(ticketId: string) {
  const svc = supportService()

  const ticket = ref<SupportTicket | null>(null)
  const isLoading = ref(false)
  const isSending = ref(false)
  const error = ref<string | null>(null)
  const sendError = ref<string | null>(null)

  async function fetchTicket(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      ticket.value = await svc.getTicket(ticketId)
      if (ticket.value.unreadCount > 0) {
        // Marquer lu est accessoire : un échec ne doit pas masquer la conversation.
        svc.markRead(ticketId).then(() => {
          if (ticket.value) ticket.value = { ...ticket.value, unreadCount: 0 }
        }).catch(() => {})
      }
    } catch {
      error.value = 'Impossible de charger cette demande.'
    } finally {
      isLoading.value = false
    }
  }

  /** Envoie une réponse ; retourne vrai quand elle est ajoutée au fil. */
  async function send(content: string): Promise<boolean> {
    const text = content.trim()
    if (!text || !ticket.value || ticket.value.status === 'RESOLVED') return false
    isSending.value = true
    sendError.value = null
    try {
      const message = await svc.reply(ticketId, text)
      ticket.value = {
        ...ticket.value,
        // Une demande résolue refuse les réponses (422) : on ne passe ici que sur une demande ouverte.
        status: 'WAITING_SUPPORT',
        messages: [...(ticket.value.messages ?? []), message],
      }
      return true
    } catch (e) {
      const { detail } = extractProblem(e)
      sendError.value = detail && !TECHNICAL_ERROR_PATTERN.test(detail)
        ? detail
        : "Impossible d'envoyer ton message. Réessaie."
      return false
    } finally {
      isSending.value = false
    }
  }

  return { ticket, isLoading, isSending, error, sendError, fetchTicket, send }
}
