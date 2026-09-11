// tests/unit/features/demandes/filterRequests.spec.ts
import { describe, it, expect } from 'vitest'
import { filterRequests } from '@/features/demandes/lib/filterRequests'
import { DEFAULT_FILTER_STATE } from '@/features/demandes/types/index'
import type { MatchingRequest } from '@/features/demandes/types/index'

function request(over: Partial<MatchingRequest> & { id: string }): MatchingRequest {
  return {
    tripId: 'trip-1',
    tripCorridor: 'Paris → Dakar',
    tripDepartureDate: '2026-06-15',
    tripAvailableKg: 20,
    senderId: 's1',
    senderName: 'Fatou',
    senderInitials: 'F',
    senderAvatarUrl: null,
    senderRating: 4,
    senderTotalSent: 2,
    weightKg: 5,
    contentType: 'Vêtements',
    budgetPerKg: 8,
    packagePhotoUrl: null,
    messageExcerpt: '',
    matchScore: 50,
    requestedAt: '2026-05-10T08:00:00Z',
    ...over,
  }
}

const eur8 = request({ id: 'eur8', budgetPerKg: 8, currency: 'EUR', matchScore: 70 })
const eur12 = request({ id: 'eur12', budgetPerKg: 12, currency: 'EUR', matchScore: 60 })
const xof5000 = request({ id: 'xof5000', budgetPerKg: 5000, currency: 'XOF', matchScore: 90 })
const noCurrency = request({ id: 'nocur', budgetPerKg: 9, matchScore: 40 })

describe('filterRequests', () => {
  it('sans filtre, trie par score', () => {
    const ids = filterRequests([eur8, eur12, xof5000], DEFAULT_FILTER_STATE).map(r => r.id)
    expect(ids).toEqual(['xof5000', 'eur8', 'eur12'])
  })

  it('le filtre budget ne compare que les demandes de la devise active', () => {
    // 5 000 F CFA/kg n'est pas « supérieur » à 10 €/kg : la demande en XOF est écartée.
    const ids = filterRequests([eur8, eur12, xof5000], { ...DEFAULT_FILTER_STATE, minBudgetPerKg: 10 }, { currency: 'EUR' }).map(r => r.id)
    expect(ids).toEqual(['eur12'])
  })

  it('en devise active XOF, seules les demandes en francs CFA passent le filtre', () => {
    const ids = filterRequests([eur8, eur12, xof5000], { ...DEFAULT_FILTER_STATE, minBudgetPerKg: 3000 }, { currency: 'xof' }).map(r => r.id)
    expect(ids).toEqual(['xof5000'])
  })

  it('une demande sans devise est traitée comme en euros', () => {
    const ids = filterRequests([noCurrency, xof5000], { ...DEFAULT_FILTER_STATE, minBudgetPerKg: 8 }).map(r => r.id)
    expect(ids).toEqual(['nocur'])
  })

  it('applique trajet, poids, type et tris', () => {
    const heavy = request({ id: 'heavy', weightKg: 30, tripId: 'trip-2', contentType: 'Électronique', requestedAt: '2026-05-12T08:00:00Z' })
    expect(filterRequests([eur8, heavy], DEFAULT_FILTER_STATE, { selectedTripId: 'trip-2' }).map(r => r.id)).toEqual(['heavy'])
    expect(filterRequests([eur8, heavy], { ...DEFAULT_FILTER_STATE, maxWeightKg: 10 }).map(r => r.id)).toEqual(['eur8'])
    expect(filterRequests([eur8, heavy], { ...DEFAULT_FILTER_STATE, contentType: 'Électronique' }).map(r => r.id)).toEqual(['heavy'])
    expect(filterRequests([eur8, heavy], { ...DEFAULT_FILTER_STATE, sortBy: 'date' }).map(r => r.id)).toEqual(['heavy', 'eur8'])
    expect(filterRequests([eur8, eur12], { ...DEFAULT_FILTER_STATE, sortBy: 'price' }).map(r => r.id)).toEqual(['eur12', 'eur8'])
  })
})
