// app/features/trajets/types/index.ts

export type TripStatus = 'DRAFT' | 'ACTIVE' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type TransportMode = 'PLANE' | 'CAR' | 'TRAIN' | 'BUS' | 'BOAT' | 'OTHER'
export type CapacityUnit = 'SUITCASE_23KG' | 'SUITCASE_32KG' | 'KG_FREE'
export type TripFilter = 'TOUS' | 'ACTIFS' | 'COMPLETS' | 'EN_COURS' | 'TERMINES' | 'ANNULES' | 'BROUILLONS'
export type ViewMode = 'list' | 'calendar'
export type DateMode = 'none' | 'day' | 'period'

export interface CorridorOption {
  departure: string
  arrival: string
}

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

export interface UserTripTemplate {
  id: string
  label: string
  emoji: string | null
  departureCity: SelectedPlace
  arrivalCity: SelectedPlace
  transportMode: TransportMode
  capacityUnit: CapacityUnit
  availableWeightKg: number
  pricePerKg: number
  acceptedCategories: string[]
  cashAccepted: boolean
  arrivalTime: string | null
}

export interface SaveTripTemplatePayload {
  label: string
  emoji: string | null
  departureCity: string
  departureLat: number | null
  departureLng: number | null
  arrivalCity: string
  arrivalLat: number | null
  arrivalLng: number | null
  transportMode: TransportMode
  capacityUnit: CapacityUnit
  availableKg: number
  pricePerKg: number
  acceptedCategories: string[]
  cashAccepted: boolean
  arrivalTime: string | null
}

export interface UserTripRecurrence {
  id: string
  sourceTemplateId: string | null
  departureCity: string
  arrivalCity: string
  transportMode: TransportMode
  capacityUnit: CapacityUnit
  availableKg: number
  pricePerKg: number
  acceptedCategories: string[]
  pickupAddress: SelectedPlace
  deliveryAddress: SelectedPlace
  departureTime: string | null
  arrivalTime: string | null
  cashAccepted: boolean
  weekdays: string
  horizonDays: number
  active: boolean
  lastGeneratedDate: string | null
}

export interface SaveTripRecurrencePayload {
  sourceTemplateId: string | null
  departureCity: string
  arrivalCity: string
  transportMode: TransportMode
  capacityUnit: CapacityUnit
  availableKg: number
  pricePerKg: number
  acceptedCategories: string[]
  pickupAddress: { label: string; lat: number; lng: number }
  deliveryAddress: { label: string; lat: number; lng: number }
  departureTime: string | null
  arrivalTime: string | null
  cashAccepted: boolean
  weekdays: string
  horizonDays: number | null
  active: boolean
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
  capacityUnit?: CapacityUnit
  pricePerKg: number
  acceptedCategories: string[]
  refusedCategories: string[]
  senderNote: string | null
  cashAccepted: boolean
  handoverWindowStart: string | null   // ISO UTC datetime
  handoverWindowEnd: string | null     // ISO UTC datetime
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
  capacityUnit: CapacityUnit
  pricePerKg: number
  acceptedCategories: string[]
  refusedCategories: string[]
  senderNote: string
  cashAccepted: boolean
  handoverWindowStart: string   // <input type="datetime-local"> value, ex "2026-06-01T10:00"
  handoverWindowEnd: string
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
  capacityUnit: CapacityUnit
  pricePerKg: number
  description: string | null
  acceptedContentTypes: string[]
  refusedTypes: string[]
  acceptedPaymentMethods: string[]
  handoverWindowStart: string | null   // ISO UTC datetime
  handoverWindowEnd: string | null
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
  handoverWindowStart?: string
  global?: string
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

export type TrackingEventType = 'DEPART' | 'TRANSIT' | 'ARRIVEE'

export interface TrackingEvent {
  id: string
  bidId: string
  eventType: string
  scannedAt: string | null
  gpsLat: number | null
  gpsLon: number | null
  photoUrl: string | null
  createdAt: string
}

export interface QrCode {
  bidId: string
  scanUrl: string
  qrCodeBase64: string
}
