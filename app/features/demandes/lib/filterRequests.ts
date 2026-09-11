// app/features/demandes/lib/filterRequests.ts
import { normalizeCurrency } from '@/lib/money'
import type { FilterState, MatchingRequest } from '@/features/demandes/types/index'

/**
 * Applique les filtres locaux aux demandes reçues.
 *
 * Le filtre « budget minimum au kilo » est exprimé dans la devise active du
 * voyageur : une demande d'une autre devise n'est pas comparable (5 000 F CFA
 * ne sont pas « supérieurs » à 8 €), elle est donc écartée tant que ce filtre
 * est actif. Sans devise connue, on retombe sur l'euro comme le reste du portail.
 */
export function filterRequests(
  requests: MatchingRequest[],
  filters: FilterState,
  options: { selectedTripId?: string | null; currency?: string | null } = {},
): MatchingRequest[] {
  const activeCurrency = normalizeCurrency(options.currency)
  let result = [...requests]

  if (options.selectedTripId) {
    result = result.filter(r => r.tripId === options.selectedTripId)
  }
  if (filters.maxWeightKg !== null) {
    result = result.filter(r => r.weightKg <= filters.maxWeightKg!)
  }
  if (filters.minBudgetPerKg !== null) {
    result = result.filter(r =>
      normalizeCurrency(r.currency) === activeCurrency && r.budgetPerKg >= filters.minBudgetPerKg!,
    )
  }
  if (filters.contentType !== null) {
    result = result.filter(r => r.contentType === filters.contentType)
  }

  switch (filters.sortBy) {
    case 'date':
      result.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
      break
    case 'price':
      result.sort((a, b) => b.budgetPerKg - a.budgetPerKg)
      break
    default:
      result.sort((a, b) => b.matchScore - a.matchScore)
  }
  return result
}
