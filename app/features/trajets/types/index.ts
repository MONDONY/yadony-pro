// app/features/trajets/types/index.ts

export type TripStatus = 'ACTIVE' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type TransportMode = 'PLANE' | 'CAR' | 'TRAIN' | 'BUS' | 'BOAT' | 'OTHER'
export type TripFilter = 'TOUS' | 'ACTIFS' | 'COMPLETS' | 'EN_COURS' | 'TERMINES' | 'ANNULES'
export type ViewMode = 'list' | 'calendar'

export interface PlaceSuggestion {
  placeId: string
  mainText: string
  secondaryText: string
}

export interface PlaceDetails {
  label: string
  lat: number
  lng: number
}

export interface SelectedPlace {
  placeId: string
  label: string
  lat: number
  lng: number
}

export interface Trip {
  id: string
  status: TripStatus
  departureCity: SelectedPlace
  arrivalCity: SelectedPlace
  departureDate: string          // ISO date: "2026-06-01"
  departureTime: string | null   // "14:30" or null
  arrivalTime: string | null
  transportMode: TransportMode
  pickupPlace: SelectedPlace
  dropoffPlace: SelectedPlace
  availableWeightKg: number
  usedWeightKg: number
  pricePerKg: number
  acceptedCategories: string[]
  refusedCategories: string[]
  senderNote: string | null
  cashAccepted: boolean
  confirmedParcelCount: number
  pendingBidCount: number
  reservedRevenueEuros: number
  createdAt: string
}

export interface TripPage {
  content: Trip[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface AnnouncementFormData {
  departureCity: SelectedPlace | null
  departureTime: string
  arrivalCity: SelectedPlace | null
  arrivalTime: string
  departureDate: string
  transportMode: TransportMode | null
  pickupPlace: SelectedPlace | null
  dropoffPlace: SelectedPlace | null
  availableWeightKg: number
  pricePerKg: number
  acceptedCategories: string[]
  refusedCategories: string[]
  senderNote: string
  cashAccepted: boolean
}

export interface CreateAnnouncementPayload {
  departureCity: string
  arrivalCity: string
  departureDate: string
  departureTime: string | null
  arrivalTime: string | null
  transportMode: TransportMode
  pickupAddress: { label: string; lat: number; lng: number }
  deliveryAddress: { label: string; lat: number; lng: number }
  availableKg: number
  pricePerKg: number
  description: string | null
  acceptedContentTypes: string[]
  refusedTypes: string[]
  acceptedPaymentMethods: string[]
}

export interface ValidationErrors {
  departureCity?: string
  arrivalCity?: string
  departureDate?: string
  transportMode?: string
  pickupPlace?: string
  dropoffPlace?: string
  availableWeightKg?: string
  pricePerKg?: string
}

export interface TripBid {
  id: string
  senderId: string
  senderName: string
  senderInitials: string
  senderTotalShipments: number
  weightKg: number
  declaredValueEuros: number
  contentDescription: string
  status: string
  paymentAmountEuros: number
  earningsEuros: number
  paymentMethod: string | null
  createdAt: string
}

export interface TripKpis {
  fillRatePct: number
  grossRevenueEuros: number
  commissionEuros: number
  netRevenueEuros: number
  revenuePerKg: number
}
