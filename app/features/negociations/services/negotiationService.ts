import { useApi } from '@/composables/useApi'
import type { NegotiationThread, StartNegotiationPayload, CounterPayload, CreateDedicatedTripPayload } from '../types'

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

  async function accept(id: string, body?: string): Promise<NegotiationThread> {
    return api<NegotiationThread>(`/negotiations/${id}/accept`, {
      method: 'POST',
      body: { body: body ?? null },
    })
  }

  async function createDedicatedTrip(id: string, payload: CreateDedicatedTripPayload): Promise<NegotiationThread> {
    return api<NegotiationThread>(`/negotiations/${id}/create-dedicated-trip`, {
      method: 'POST',
      body: payload,
    })
  }

  async function refuseTrip(id: string): Promise<NegotiationThread> {
    return api<NegotiationThread>(`/negotiations/${id}/refuse-trip`, { method: 'POST' })
  }

  return { startNegotiation, listMine, getById, counter, reject, submitTrip, accept, createDedicatedTrip, refuseTrip }
}
