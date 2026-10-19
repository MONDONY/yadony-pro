import { ref } from 'vue'
import { pricingService } from '@/features/pricing/services/pricingService'
import { useCommissionGrid } from '@/composables/useCommissionGrid'
import type { CommissionGrid } from '@/lib/commissionGrid'
import type { MarketPrice, PricingCorridor } from '@/features/pricing/types/index'

export function usePricing() {
  const corridorKey = ref<string | null>(null)
  const marketPrice = ref<MarketPrice | null>(null)
  // Grille de commission en vigueur ; null sans grille (aucun minimum annoncé).
  const commissionGrid = ref<CommissionGrid | null>(null)
  const corridors = ref<PricingCorridor[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const svc = pricingService()
  const { getGrid } = useCommissionGrid()

  async function loadCommissionGrid(): Promise<void> {
    // getGrid ne lève jamais : sans grille ou en cas d'échec, on reste à null.
    commissionGrid.value = await getGrid()
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

  return { corridorKey, marketPrice, commissionGrid, corridors, isLoading, error, loadCommissionGrid, loadCorridors, selectCorridor }
}
