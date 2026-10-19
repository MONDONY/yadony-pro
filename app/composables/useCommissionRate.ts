// app/composables/useCommissionRate.ts
import { useApi } from '@/composables/useApi'

interface CommissionRateResponse {
  rate: number
}

// Cache module-level : une seule requête pour toute la session, partagée
// entre toutes les features (colis, trajets, pricing…).
let cachedRate: number | null = null
let pending: Promise<number | null> | null = null

function isValidRate(rate: unknown): rate is number {
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 0 && rate < 1
}

export function useCommissionRate() {
  const api = useApi()

  /**
   * Taux unique servi par le back (première tranche quand une grille est en
   * vigueur). `null` si le back est injoignable ou renvoie une valeur invalide :
   * aucun taux de repli n'est inventé, l'appelant n'affiche alors pas de montant.
   */
  async function getRate(): Promise<number | null> {
    if (cachedRate !== null) return cachedRate
    if (pending) return pending
    pending = api<CommissionRateResponse>('/config/commission-rate')
      .then((res) => {
        if (!isValidRate(res?.rate)) return null
        cachedRate = res.rate
        return res.rate
      })
      .catch(() => null) // pas de cache sur échec → retente au prochain appel
      .finally(() => {
        pending = null
      })
    return pending
  }

  return { getRate }
}

/** Réservé aux tests. */
export function resetCommissionRateCache(): void {
  cachedRate = null
  pending = null
}
