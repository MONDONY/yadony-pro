import { useApi } from '@/composables/useApi'
import type { CommissionRate, MarketPrice } from '@/features/pricing/types/index'

export function pricingService() {
  const api = useApi()

  async function fetchMarketPrice(corridorKey: string): Promise<MarketPrice> {
    return api<MarketPrice>('/announcements/market-price', { query: { corridor: corridorKey } })
  }

  async function fetchCommissionRate(): Promise<CommissionRate> {
    return api<CommissionRate>('/config/commission-rate')
  }

  return { fetchMarketPrice, fetchCommissionRate }
}
