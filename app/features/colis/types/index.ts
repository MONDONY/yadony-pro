export type BidStatus =
  | 'AWAITING_PAYMENT'
  | 'PENDING'
  | 'PAYMENT_ESCROWED'
  | 'ACCEPTED'
  | 'HANDED_OVER'
  | 'IN_TRANSIT'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'PARCEL_REFUSED'
  | 'EXPIRED'

export type BidFilter =
  | 'TOUS'
  | 'PENDING'
  | 'PAYMENT_ESCROWED'
  | 'ACCEPTED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'

export interface SenderProfile {
  id: string
  name: string
  avatarInitials: string
  rating: number
  totalSentParcels: number
}

export interface BidHistoryEntry {
  date: string
  status: BidStatus
  note: string | null
}

export interface Bid {
  id: string
  status: BidStatus
  tripId: string
  tripCorridor: string
  tripDepartureDate: string
  sender: SenderProfile
  weightKg: number
  contentDescription: string
  declaredValueEuros: number
  earningsEuros: number
  paymentStatus: 'PENDING' | 'ESCROWED' | 'RELEASED' | 'REFUNDED'
  paymentAmountEuros: number
  history: BidHistoryEntry[]
  createdAt: string
  expiresAt: string | null
}

export interface BidPage {
  content: Bid[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface BidFiltersState {
  statusFilter: BidFilter
  tripId: string | null
  senderSearch: string
}
