export interface MatchingRequest {
  id: string
  tripId: string
  tripCorridor: string
  tripDepartureDate: string
  tripAvailableKg: number
  senderName: string
  senderInitials: string
  senderRating: number
  senderTotalSent: number
  weightKg: number
  contentType: string
  budgetPerKg: number
  messageExcerpt: string
  matchScore: number
  requestedAt: string
}

export interface InvitePayload {
  requestId: string
  announcementId: string
}

export interface ActiveTrip {
  tripId: string
  tripCorridor: string       // "Paris → Dakar"
  tripDepartureDate: string  // "2026-06-15"
  tripAvailableKg: number
  matchCount: number         // nombre de demandes compatibles pour ce trajet
}

export interface FilterState {
  maxWeightKg: number | null
  minBudgetPerKg: number | null
  contentType: string | null
  sortBy: 'score' | 'date' | 'price'
}

export const DEFAULT_FILTER_STATE: FilterState = {
  maxWeightKg: null,
  minBudgetPerKg: null,
  contentType: null,
  sortBy: 'score',
}
