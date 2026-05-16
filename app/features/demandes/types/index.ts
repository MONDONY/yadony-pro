export interface MatchingRequest {
  id: string
  tripId: string
  tripCorridor: string
  tripDepartureDate: string
  tripAvailableKg: number
  senderId: string
  senderName: string
  senderInitials: string
  senderAvatarUrl: string | null
  senderRating: number
  senderTotalSent: number
  weightKg: number
  contentType: string
  budgetPerKg: number
  packagePhotoUrl: string | null
  packageDescription?: string
  messageExcerpt: string
  matchScore: number
  requestedAt: string
}

// ── Profil public expéditeur ──────────────────────────────────────────────────

export interface SenderProfile {
  userId: string
  displayName: string
  avatarUrl: string | null
  kycVerified: boolean
  isProAccount: boolean
  isKiloPro: boolean
  completedBidsCount: number
  averageRating: number
  ratingCount: number
  memberSince: string
}

export interface RatingItem {
  stars: number
  comment: string | null
  createdAt: string
}

export interface SenderRatings {
  averageRating: number
  ratingCount: number
  distribution: Record<string, number>
  ratings: RatingItem[]
  page: number
  totalPages: number
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
