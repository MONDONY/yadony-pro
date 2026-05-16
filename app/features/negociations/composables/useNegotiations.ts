// app/features/negociations/composables/useNegotiations.ts
import { ref } from 'vue'
import { negotiationService } from '@/features/negociations/services/negotiationService'
import type { NegotiationThread } from '@/features/negociations/types'

export function useNegotiations() {
  const threads = ref<NegotiationThread[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const svc = negotiationService()

  async function fetchAll(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      threads.value = await svc.listMine()
    } catch {
      error.value = 'Impossible de charger les négociations.'
    } finally {
      isLoading.value = false
    }
  }

  return { threads, isLoading, error, fetchAll }
}
