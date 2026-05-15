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
