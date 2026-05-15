import { useApi } from '@/composables/useApi'
import type { NegotiationThread, StartNegotiationPayload, CounterPayload } from '../types'

export function negotiationService() {
  const api = useApi()

  async function startNegotiation(payload: StartNegotiationPayload): Promise<NegotiationThread> {
    return api<NegotiationThread>('/negotiations', { method: 'POST', body: payload })
  }

  async function listMine(): Promise<NegotiationThread[]> {
    return api<NegotiationThread[]>('/negotiations/me', {})
  }

  async function getById(id: string): Promise<NegotiationThread> {
    return api<NegotiationThread>(`/negotiations/${id}`, {})
  }

  async function counter(id: string, payload: CounterPayload): Promise<NegotiationThread> {
    return api<NegotiationThread>(`/negotiations/${id}/counter`, { method: 'POST', body: payload })
  }

  async function reject(id: string, reason?: string): Promise<NegotiationThread> {
    return api<NegotiationThread>(`/negotiations/${id}/reject`, {
      method: 'POST',
      body: { reason: reason ?? null },
    })
  }

  async function submitTrip(id: string, travelerAnnouncementId: string): Promise<NegotiationThread> {
    return api<NegotiationThread>(`/negotiations/${id}/submit-trip`, {
      method: 'POST',
      body: { travelerAnnouncementId },
    })
  }

  return { startNegotiation, listMine, getById, counter, reject, submitTrip }
}
