import { ref } from 'vue'
import { pricingService } from '@/features/pricing/services/pricingService'
import type { MarketPrice, PricingCorridor } from '@/features/pricing/types/index'

export function usePricing() {
  const corridorKey = ref<string | null>(null)
  const marketPrice = ref<MarketPrice | null>(null)
  const commissionRate = ref(0.12)
  const corridors = ref<PricingCorridor[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const svc = pricingService()

  async function loadCommissionRate(): Promise<void> {
    try {
      const result = await svc.fetchCommissionRate()
      commissionRate.value = result.rate
    } catch {
      /* garde la valeur par défaut 0.12 si indisponible */
    }
  }

  async function loadCorridors(): Promise<void> {
    // fetchCorridors gère déjà son fallback statique en cas d'échec.
    corridors.value = await svc.fetchCorridors()
  }

  async function selectCorridor(key: string): Promise<void> {
    corridorKey.value = key
    isLoading.value = true
    error.value = null
    try {
      marketPrice.value = await svc.fetchMarketPrice(key)
    } catch {
      error.value = 'Impossible de récupérer le prix de marché pour ce corridor.'
      marketPrice.value = null
    } finally {
      isLoading.value = false
    }
  }

  return { corridorKey, marketPrice, commissionRate, corridors, isLoading, error, loadCommissionRate, loadCorridors, selectCorridor }
}
