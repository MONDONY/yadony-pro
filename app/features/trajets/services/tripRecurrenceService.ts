import { useApi } from '@/composables/useApi'
import type {
  CapacityUnit,
  SaveTripRecurrencePayload,
  TransportMode,
  UserTripRecurrence,
} from '@/features/trajets/types/index'

interface BackendAddress {
  label: string
  lat: number
  lng: number
}

interface BackendTripRecurrence {
  id: string
  sourceTemplateId: string | null
  departureCity: string
  arrivalCity: string
  transportMode: TransportMode
  capacityUnit: CapacityUnit
  availableKg: number
  pricePerKg: number
  pricingMode?: UserTripRecurrence['pricingMode'] | null
  negotiable?: boolean | null
  currency?: string | null
  acceptedCategories: string[] | null
  refusedCategories?: string[] | null
  pickupAddress: BackendAddress
  deliveryAddress: BackendAddress
  departureTime: string | null
  arrivalTime: string | null
  arrivalDayOffset?: number | null
  cashAccepted: boolean
  handoverDeadline?: string | null
  weekdays: string
  horizonDays: number
  active: boolean
  lastGeneratedDate: string | null
}

function toPlace(a: BackendAddress) {
  return { placeId: '', label: a.label, lat: a.lat, lng: a.lng }
}

function mapToRecurrence(r: BackendTripRecurrence): UserTripRecurrence {
  // L'API peut renvoyer "HH:mm:ss" — on tronque à "HH:mm".
  const time = r.departureTime ? r.departureTime.slice(0, 5) : null
  const arrival = r.arrivalTime ? r.arrivalTime.slice(0, 5) : null
  return {
    id: r.id,
    sourceTemplateId: r.sourceTemplateId,
    departureCity: r.departureCity,
    arrivalCity: r.arrivalCity,
    transportMode: r.transportMode,
    capacityUnit: r.capacityUnit,
    availableKg: r.availableKg,
    pricePerKg: r.pricePerKg,
    pricingMode: r.pricingMode ?? 'KG',
    negotiable: r.negotiable ?? false,
    currency: r.currency ?? 'EUR',
    acceptedCategories: r.acceptedCategories ?? [],
    refusedCategories: r.refusedCategories ?? [],
    pickupAddress: toPlace(r.pickupAddress),
    deliveryAddress: toPlace(r.deliveryAddress),
    departureTime: time,
    arrivalTime: arrival,
    arrivalDayOffset: r.arrivalDayOffset ?? 0,
    cashAccepted: r.cashAccepted ?? false,
    handoverDeadline: r.handoverDeadline ?? null,
    weekdays: r.weekdays,
    horizonDays: r.horizonDays,
    active: r.active,
    lastGeneratedDate: r.lastGeneratedDate,
  }
}

export function tripRecurrenceService() {
  const api = useApi()

  async function list(): Promise<UserTripRecurrence[]> {
    const result = await api<BackendTripRecurrence[]>('/trip-recurrences', {})
    return result.map(mapToRecurrence)
  }

  async function create(payload: SaveTripRecurrencePayload): Promise<UserTripRecurrence> {
    const result = await api<BackendTripRecurrence>('/trip-recurrences', { method: 'POST', body: payload })
    return mapToRecurrence(result)
  }

  async function update(id: string, payload: SaveTripRecurrencePayload): Promise<UserTripRecurrence> {
    const result = await api<BackendTripRecurrence>(`/trip-recurrences/${id}`, { method: 'PUT', body: payload })
    return mapToRecurrence(result)
  }

  async function remove(id: string): Promise<void> {
    await api<void>(`/trip-recurrences/${id}`, { method: 'DELETE' })
  }

  return { list, create, update, remove }
}

/** Reconstruit le payload depuis une récurrence existante (pour toggle actif / édition). */
export function recurrenceToPayload(r: UserTripRecurrence): SaveTripRecurrencePayload {
  return {
    sourceTemplateId: r.sourceTemplateId,
    departureCity: r.departureCity,
    arrivalCity: r.arrivalCity,
    transportMode: r.transportMode,
    capacityUnit: r.capacityUnit,
    availableKg: r.availableKg,
    pricePerKg: r.pricePerKg,
    pricingMode: r.pricingMode,
    negotiable: r.negotiable,
    currency: r.currency,
    acceptedCategories: [...r.acceptedCategories],
    refusedCategories: [...r.refusedCategories],
    pickupAddress: { label: r.pickupAddress.label, lat: r.pickupAddress.lat, lng: r.pickupAddress.lng },
    deliveryAddress: { label: r.deliveryAddress.label, lat: r.deliveryAddress.lat, lng: r.deliveryAddress.lng },
    departureTime: r.departureTime,
    arrivalTime: r.arrivalTime,
    arrivalDayOffset: r.arrivalDayOffset,
    cashAccepted: r.cashAccepted,
    handoverDeadline: null,
    weekdays: r.weekdays,
    horizonDays: r.horizonDays,
    active: r.active,
  }
}
