// app/features/trajets/types/index.ts

export type TripStatus = 'DRAFT' | 'ACTIVE' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type TransportMode = 'PLANE' | 'CAR' | 'TRAIN' | 'BUS' | 'BOAT' | 'OTHER'
export type CapacityUnit = 'SUITCASE_23KG' | 'SUITCASE_32KG' | 'KG_FREE' | 'KG_EXACT'
export type PricingMode = 'KG' | 'MIXED'
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
  pricingMode: PricingMode
  negotiable: boolean
  currency: string
  acceptedCategories: string[]
  refusedCategories: string[]
  cashAccepted: boolean
  handoverDeadline: string | null
  arrivalTime: string | null
  /** Jours entre départ et arrivée (0 à 3). */
  arrivalDayOffset: number
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
  pricingMode: PricingMode
  negotiable: boolean
  currency: string
  acceptedCategories: string[]
  refusedCategories: string[]
  cashAccepted: boolean
  handoverDeadline: string | null
  arrivalTime: string | null
  /** Jours entre départ et arrivée (0 à 3) ; absent = 0. */
  arrivalDayOffset?: number | null
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
  pricingMode: PricingMode
  negotiable: boolean
  currency: string
  acceptedCategories: string[]
  refusedCategories: string[]
  pickupAddress: SelectedPlace
  deliveryAddress: SelectedPlace
  departureTime: string | null
  arrivalTime: string | null
  /** Jours entre départ et arrivée (0 à 3). */
  arrivalDayOffset: number
  cashAccepted: boolean
  handoverDeadline: string | null
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
  pricingMode: PricingMode
  negotiable: boolean
  currency: string
  acceptedCategories: string[]
  refusedCategories: string[]
  pickupAddress: { label: string; lat: number; lng: number }
  deliveryAddress: { label: string; lat: number; lng: number }
  departureTime: string | null
  arrivalTime: string | null
  /** Jours entre départ et arrivée (0 à 3) ; absent = 0. */
  arrivalDayOffset?: number | null
  cashAccepted: boolean
  handoverDeadline: string | null
  weekdays: string
  horizonDays: number | null
  active: boolean
}

export type RescheduleReason = 'FLIGHT_CANCELLED' | 'POSTPONED' | 'OTHER'

export interface RescheduleTripPayload {
  departureDate: string
  departureTime: string
  arrivalDate: string | null
  arrivalTime: string | null
  handoverDeadline: string
  reason: RescheduleReason
  note: string | null
}

export interface RescheduleTripResult {
  rescheduleCount: number
  remainingReschedules: number
  /** Colis acceptés ou remis dont l'expéditeur doit garder ou quitter le trajet reporté. */
  parcelsAwaitingDecision: number
  /** Demandes seulement prévenues du nouveau calendrier. */
  requestsInformed: number
}

export interface Trip {
  id: string
  status: TripStatus
  departureCity: SelectedPlace
  arrivalCity: SelectedPlace
  departureDate: string          // ISO date: "2026-06-01"
  departureTime: string | null   // "14:30" or null
  arrivalTime: string | null
  arrivalDate: string | null
  /** Reports encore possibles (sur 2) ; absent ou null si le backend ne le sert pas. */
  remainingReschedules?: number | null
  transportMode: TransportMode
  pickupPlace: SelectedPlace
  dropoffPlace: SelectedPlace
  availableWeightKg: number
  usedWeightKg: number
  capacityUnit?: CapacityUnit
  pricingMode?: PricingMode
  negotiable?: boolean
  currency?: string
  pricePerKg: number
  acceptedCategories: string[]
  refusedCategories: string[]
  senderNote: string | null
  cashAccepted: boolean
  handoverDeadline: string | null      // ISO UTC datetime — date limite de dépôt
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
  arrivalDate: string
  departureDate: string
  transportMode: TransportMode | null
  pickupPlace: SelectedPlace | null
  dropoffPlace: SelectedPlace | null
  availableWeightKg: number
  capacityUnit: CapacityUnit
  pricingMode: PricingMode
  negotiable: boolean
  currency: string
  pricePerKg: number
  acceptedCategories: string[]
  refusedCategories: string[]
  senderNote: string
  cashAccepted: boolean
  handoverDeadline: string   // <input type="date"> value, ex "2026-06-01"
}

export interface CreateAnnouncementPayload {
  departureCity: string
  arrivalCity: string
  departureDate: string
  departureTime: string | null
  arrivalTime: string | null
  arrivalDate?: string | null
  transportMode: TransportMode
  pickupAddress: { label: string; lat: number; lng: number }
  deliveryAddress: { label: string; lat: number; lng: number }
  availableKg: number
  capacityUnit: CapacityUnit
  pricingMode: PricingMode
  negotiable: boolean
  currency: string
  pricePerKg: number
  description: string | null
  acceptedContentTypes: string[]
  refusedTypes: string[]
  acceptedPaymentMethods: string[]
  handoverDeadline: string | null      // ISO UTC datetime — date limite de dépôt
}

export interface ValidationErrors {
  departureCity?: string
  arrivalCity?: string
  departureDate?: string
  arrivalDate?: string
  transportMode?: string
  pickupPlace?: string
  dropoffPlace?: string
  availableWeightKg?: string
  pricePerKg?: string
  handoverDeadline?: string
  global?: string
}

export interface TripBid {
  id: string
  senderId: string
  senderName: string
  senderInitials: string
  senderTotalShipments: number
  weightKg: number
  contentDescription: string
  status: string
  /** Devise du bid (celle du trajet) : tous les montants ci-dessous s'y expriment. */
  currency: string
  paymentAmountEuros: number
  earningsEuros: number
  paymentMethod: string | null
  negotiationRound?: number
  negotiationMyTurn?: boolean
  negotiationCanCounter?: boolean
  negotiationCurrency?: string
  negotiationProposedGrossEuros?: number
  createdAt: string
}

export interface CounterBidNegotiationPayload {
  proposedTotalEur: number
  body?: string | null
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
