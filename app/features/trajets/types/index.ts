// app/features/trajets/types/index.ts

export type TripStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
export type TransportMode = 'AVION' | 'VOITURE' | 'BUS' | 'VELO' | 'A_PIED'
export type TripFilter = 'TOUS' | 'ACTIFS' | 'A_VENIR' | 'TERMINES' | 'ARCHIVES'
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
  departureCityId: string
  departureCityLabel: string
  departureLat: number
  departureLng: number
  arrivalCityId: string
  arrivalCityLabel: string
  arrivalLat: number
  arrivalLng: number
  departureDate: string
  departureTime: string | null
  arrivalTime: string | null
  transportMode: TransportMode
  pickupPlaceId: string
  pickupPlaceLabel: string
  pickupLat: number
  pickupLng: number
  dropoffPlaceId: string
  dropoffPlaceLabel: string
  dropoffLat: number
  dropoffLng: number
  availableWeightKg: number
  pricePerKg: number
  acceptedCategories: string[]
  refusedCategories: string[]
  senderNote: string | null
  cashAccepted: boolean
  status: 'DRAFT' | 'PUBLISHED'
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
