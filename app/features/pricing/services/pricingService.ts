import { useApi } from '@/composables/useApi'
import { PRICING_CORRIDORS } from '@/features/pricing/types/index'
import type { CommissionRate, MarketPrice, PricingCorridor } from '@/features/pricing/types/index'

interface PopularCorridorResponse {
  departureCity: string
  departureCountry: string
  arrivalCity: string
  arrivalCountry: string
}

/** « Genève » → « GENEVE » : clé corridor sans accents ni espaces. */
function toCorridorKeyPart(city: string): string {
  return city
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

export function pricingService() {
  const api = useApi()

  async function fetchMarketPrice(corridorKey: string): Promise<MarketPrice> {
    return api<MarketPrice>('/announcements/market-price', { query: { corridor: corridorKey } })
  }

  async function fetchCommissionRate(): Promise<CommissionRate> {
    return api<CommissionRate>('/config/commission-rate')
  }

  async function fetchCorridors(): Promise<PricingCorridor[]> {
    try {
      const popular = await api<PopularCorridorResponse[]>('/cities/corridors/popular', {
        query: { limit: 6 },
      })
      if (!popular || popular.length === 0) return PRICING_CORRIDORS
      return popular.map((c) => ({
        key: `${toCorridorKeyPart(c.departureCity)}_${toCorridorKeyPart(c.arrivalCity)}`,
        label: `${c.departureCity} → ${c.arrivalCity}`,
      }))
    } catch {
      // Back injoignable → liste statique pour ne pas casser l'assistant.
      return PRICING_CORRIDORS
    }
  }

  return { fetchMarketPrice, fetchCommissionRate, fetchCorridors }
}
