// app/composables/useCommissionGrid.ts
import { useApi } from '@/composables/useApi'
import { parseCommissionGrid, type CommissionGrid } from '@/lib/commissionGrid'

// Cache module-level : `undefined` = pas encore chargé, `null` = pas de grille
// en vigueur (back sans la route, ou `current` à null) → taux unique.
let cachedGrid: CommissionGrid | null | undefined
let pending: Promise<CommissionGrid | null> | null = null

function isNotFound(error: unknown): boolean {
  const e = error as { statusCode?: number; status?: number; response?: { status?: number } } | null
  return (e?.statusCode ?? e?.status ?? e?.response?.status) === 404
}

export function useCommissionGrid() {
  const api = useApi()

  /**
   * Grille de commission en vigueur (`GET /config/commission-grid`), ou `null`
   * sans grille. Un back qui ne connaît pas la route (404) vaut « pas de grille » ;
   * toute autre erreur renvoie aussi `null` mais n'est pas mise en cache, pour
   * retenter au prochain appel.
   */
  async function getGrid(): Promise<CommissionGrid | null> {
    if (cachedGrid !== undefined) return cachedGrid
    if (pending) return pending
    pending = api<unknown>('/config/commission-grid')
      .then((res) => {
        cachedGrid = parseCommissionGrid(res)
        return cachedGrid
      })
      .catch((error: unknown) => {
        if (isNotFound(error)) cachedGrid = null
        return null
      })
      .finally(() => {
        pending = null
      })
    return pending
  }

  return { getGrid }
}

/** Réservé aux tests. */
export function resetCommissionGridCache(): void {
  cachedGrid = undefined
  pending = null
}
