// app/features/support/composables/useSupportTickets.ts
import { ref } from 'vue'
import { supportService } from '@/features/support/services/supportService'
import { extractProblem, TECHNICAL_ERROR_PATTERN } from '@/lib/apiError'
import type {
  CreateSupportTicketPayload, SupportPredefinedReply, SupportTicket,
} from '@/features/support/types/index'

/** Liste des demandes de support, création d'une demande et questions fréquentes. */
export function useSupportTickets() {
  const svc = supportService()

  const tickets = ref<SupportTicket[]>([])
  const faq = ref<SupportPredefinedReply[]>([])
  const isLoading = ref(false)
  const isCreating = ref(false)
  const error = ref<string | null>(null)
  const createError = ref<string | null>(null)

  async function fetchTickets(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      tickets.value = (await svc.listTickets()).content
    } catch {
      error.value = 'Impossible de charger tes demandes de support.'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchFaq(): Promise<void> {
    try {
      faq.value = await svc.listReplies()
    } catch {
      faq.value = []
    }
  }

  /** Crée la demande et retourne son identifiant, ou null en cas d'échec. */
  async function createTicket(payload: CreateSupportTicketPayload): Promise<string | null> {
    isCreating.value = true
    createError.value = null
    try {
      const ticket = await svc.createTicket({
        ...payload,
        subject: payload.subject.trim(),
        message: payload.message.trim(),
      })
      tickets.value = [ticket, ...tickets.value]
      return ticket.id
    } catch (e) {
      const { detail } = extractProblem(e)
      createError.value = detail && !TECHNICAL_ERROR_PATTERN.test(detail)
        ? detail
        : "Impossible d'envoyer ta demande. Réessaie."
      return null
    } finally {
      isCreating.value = false
    }
  }

  return { tickets, faq, isLoading, isCreating, error, createError, fetchTickets, fetchFaq, createTicket }
}
