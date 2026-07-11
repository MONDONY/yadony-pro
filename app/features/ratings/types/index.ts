// app/features/ratings/types/index.ts

export interface PendingRating {
  bidId: string
  otherPartyName: string
  otherPartyId: string
  deliveredAt: string
  isTravelerRating: boolean
}

export interface RatingItem {
  stars: number
  comment: string | null
  createdAt: string
  excluded: boolean
  authorName: string | null
  authorAvatarUrl: string | null
  departureCity: string | null
  arrivalCity: string | null
}

export interface RatingsSummary {
  averageRating: number | null
  ratingCount: number
  distribution: Record<number, number>
  ratings: RatingItem[]
  page: number
  totalPages: number
}
