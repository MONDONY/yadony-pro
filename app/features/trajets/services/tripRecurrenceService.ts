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
  acceptedCategories: string[] | null
  pickupAddress: BackendAddress
  deliveryAddress: BackendAddress
  departureTime: string | null
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
  return {
    id: r.id,
    sourceTemplateId: r.sourceTemplateId,
    departureCity: r.departureCity,
    arrivalCity: r.arrivalCity,
    transportMode: r.transportMode,
    capacityUnit: r.capacityUnit,
    availableKg: r.availableKg,
    pricePerKg: r.pricePerKg,
    acceptedCategories: r.acceptedCategories ?? [],
    pickupAddress: toPlace(r.pickupAddress),
    deliveryAddress: toPlace(r.deliveryAddress),
    departureTime: time,
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
    acceptedCategories: [...r.acceptedCategories],
    pickupAddress: { label: r.pickupAddress.label, lat: r.pickupAddress.lat, lng: r.pickupAddress.lng },
    deliveryAddress: { label: r.deliveryAddress.label, lat: r.deliveryAddress.lat, lng: r.deliveryAddress.lng },
    departureTime: r.departureTime,
    weekdays: r.weekdays,
    horizonDays: r.horizonDays,
    active: r.active,
  }
}
