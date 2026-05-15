export type NegotiationStatus =
  | 'OPEN'
  | 'AWAITING_TRIP'
  | 'AWAITING_PAYMENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'AUTO_REJECTED'
  | 'EXPIRED'

export type NegotiationMessageKind = 'PROPOSAL' | 'COUNTER' | 'ACCEPT' | 'REJECT'

export interface NegotiationMessage {
  id: string
  threadId: string
  fromUserId: string
  kind: NegotiationMessageKind
  proposedPriceEur: number | null
  body: string | null
  createdAt: string
}

export interface NegotiationThread {
  id: string
  packageRequestId: string
  travelerId: string
  travelerAnnouncementId: string | null
  travelerTravelDate: string
  travelerAvailableKg: number
  status: NegotiationStatus
  currentPriceEur: number
  roundsCount: number
  lastActivityAt: string
  createdAt: string
  messages: NegotiationMessage[]
  paymentIntentClientSecret: string | null
  travelerName: string
  travelerRating: number | null
  travelerTripsCount: number
  travelerPhotoUrl: string | null
  departureCity: string
  arrivalCity: string
  weightKg: number
  senderName: string
  // Champs calculés par le backend selon le callerId
  isMyTurn: boolean
  canAccept: boolean
  canCounter: boolean
  roundsRemaining: number
}

export interface StartNegotiationPayload {
  packageRequestId: string
  proposedPriceEur: number
  travelerTravelDate: string
  travelerAvailableKg: number
  travelerAnnouncementId: string
  body?: string
}

export interface CounterPayload {
  proposedPriceEur: number
  body?: string
}

export interface CreateDedicatedTripPayload {
  departureDate: string   // format ISO 'YYYY-MM-DD'
  availableKg: number
  body?: string
}
