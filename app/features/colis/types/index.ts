export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'IN_TRANSIT' | 'DELIVERED' | 'DISPUTE'
export type BidFilter = 'TOUS' | 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'IN_TRANSIT' | 'DELIVERED' | 'DISPUTE'

export interface SenderProfile {
  id: string
  name: string
  avatarInitials: string
  rating: number // 1.0–5.0
  totalSentParcels: number
}

export interface BidHistoryEntry {
  date: string       // ISO datetime
  status: BidStatus
  note: string | null
}

export interface Bid {
  id: string
  status: BidStatus
  tripId: string
  tripCorridor: string        // e.g. "Paris → Dakar"
  tripDepartureDate: string   // ISO date "2026-06-01"
  sender: SenderProfile
  weightKg: number
  contentDescription: string
  declaredValueEuros: number
  earningsEuros: number       // after 12% commission
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
  dateFrom: string | null
  dateTo: string | null
}
