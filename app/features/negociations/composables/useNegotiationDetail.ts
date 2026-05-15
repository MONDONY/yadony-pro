// app/features/negociations/composables/useNegotiationDetail.ts
import { ref } from 'vue'
import { negotiationService } from '@/features/negociations/services/negotiationService'
import type { NegotiationThread, CounterPayload, CreateDedicatedTripPayload } from '@/features/negociations/types'

export function useNegotiationDetail(threadId: string) {
  const thread = ref<NegotiationThread | null>(null)
  const isLoading = ref(false)
  const actionLoading = ref(false)
  const error = ref<string | null>(null)

  const svc = negotiationService()

  async function fetchThread(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      thread.value = await svc.getById(threadId)
    } catch {
      error.value = 'Impossible de charger cette négociation.'
    } finally {
      isLoading.value = false
    }
  }

  async function submitCounter(payload: CounterPayload): Promise<void> {
    actionLoading.value = true
    try {
      thread.value = await svc.counter(threadId, payload)
    } finally {
      actionLoading.value = false
    }
  }

  async function rejectThread(reason?: string): Promise<void> {
    actionLoading.value = true
    try {
      thread.value = await svc.reject(threadId, reason)
    } finally {
      actionLoading.value = false
    }
  }

  async function linkTrip(announcementId: string): Promise<void> {
    actionLoading.value = true
    try {
      thread.value = await svc.submitTrip(threadId, announcementId)
    } finally {
      actionLoading.value = false
    }
  }

  async function acceptThread(body?: string): Promise<void> {
    actionLoading.value = true
    try {
      thread.value = await svc.accept(threadId, body)
    } finally {
      actionLoading.value = false
    }
  }

  async function createDedicatedTrip(payload: CreateDedicatedTripPayload): Promise<void> {
    actionLoading.value = true
    try {
      thread.value = await svc.createDedicatedTrip(threadId, payload)
    } finally {
      actionLoading.value = false
    }
  }

  async function refuseTrip(): Promise<void> {
    actionLoading.value = true
    try {
      thread.value = await svc.refuseTrip(threadId)
    } finally {
      actionLoading.value = false
    }
  }

  return { thread, isLoading, actionLoading, error, fetchThread, submitCounter, rejectThread, linkTrip, acceptThread, createDedicatedTrip, refuseTrip }
}
