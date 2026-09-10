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
  // null quand le poids n'est pas renseigné (mode GRID, bid rejeté sans pesée) —
  // les revenus en découlent, donc null aussi tant que le poids est inconnu.
  weightKg: number | null
  contentDescription: string
  /** Devise du bid (ISO 4217) : tous les montants ci-dessous s'y expriment. */
  currency: string
  /** Net voyageur, servi par le backend (accord négocié, grille, taux figé) ; calcul local en repli. */
  earningsEuros: number | null
  paymentStatus: 'PENDING' | 'ESCROWED' | 'RELEASED' | 'REFUNDED'
  /** Brut payé par l'expéditeur, servi par le backend ; calcul local en repli. */
  paymentAmountEuros: number | null
  history: BidHistoryEntry[]
  createdAt: string
  expiresAt: string | null
  trackingNumber: string | null
  trackingToken: string | null
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
  search: string
}
