// app/features/disputes/composables/useDisputes.ts
import { ref } from 'vue'
import { disputesService } from '@/features/disputes/services/disputesService'
import type { Dispute } from '@/features/disputes/types/index'

export function useDisputes() {
  const disputes = ref<Dispute[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const svc = disputesService()

  async function fetchDisputes(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      disputes.value = await svc.getMyDisputes()
    } catch {
      error.value = 'Impossible de charger tes litiges.'
    } finally {
      isLoading.value = false
    }
  }

  return { disputes, isLoading, error, fetchDisputes }
}
