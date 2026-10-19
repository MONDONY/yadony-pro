// app/composables/useCommissionContext.ts
import { useCommissionGrid } from '@/composables/useCommissionGrid'
import { useCommissionRate } from '@/composables/useCommissionRate'
import type { CommissionContext } from '@/lib/commissionGrid'

/**
 * Contexte de commission pour les replis de calcul local : la grille en vigueur
 * si le back en sert une, sinon le taux unique. Les montants du back priment
 * toujours ; ce contexte ne sert que quand ils manquent.
 */
export function useCommissionContext() {
  const { getGrid } = useCommissionGrid()
  const { getRate } = useCommissionRate()

  async function getContext(): Promise<CommissionContext> {
    const grid = await getGrid()
    if (grid) return { grid, rate: null }
    return { grid: null, rate: await getRate() }
  }

  return { getContext }
}
