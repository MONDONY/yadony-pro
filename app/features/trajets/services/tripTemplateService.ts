import { useApi } from '@/composables/useApi'
import type {
  CapacityUnit,
  SaveTripTemplatePayload,
  TransportMode,
  UserTripTemplate,
} from '@/features/trajets/types/index'

interface BackendTripTemplate {
  id: string
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
  acceptedCategories: string[] | null
  cashAccepted: boolean
  arrivalTime: string | null
}

function mapToTemplate(t: BackendTripTemplate): UserTripTemplate {
  return {
    id: t.id,
    label: t.label,
    emoji: t.emoji,
    departureCity: { placeId: '', label: t.departureCity, lat: t.departureLat ?? 0, lng: t.departureLng ?? 0 },
    arrivalCity: { placeId: '', label: t.arrivalCity, lat: t.arrivalLat ?? 0, lng: t.arrivalLng ?? 0 },
    transportMode: t.transportMode,
    capacityUnit: t.capacityUnit,
    availableWeightKg: t.availableKg,
    pricePerKg: t.pricePerKg,
    acceptedCategories: t.acceptedCategories ?? [],
    cashAccepted: t.cashAccepted ?? false,
    arrivalTime: t.arrivalTime ? t.arrivalTime.slice(0, 5) : null,
  }
}

export function tripTemplateService() {
  const api = useApi()

  async function list(): Promise<UserTripTemplate[]> {
    const result = await api<BackendTripTemplate[]>('/trip-templates', {})
    return result.map(mapToTemplate)
  }

  async function create(payload: SaveTripTemplatePayload): Promise<UserTripTemplate> {
    const result = await api<BackendTripTemplate>('/trip-templates', { method: 'POST', body: payload })
    return mapToTemplate(result)
  }

  async function update(id: string, payload: SaveTripTemplatePayload): Promise<UserTripTemplate> {
    const result = await api<BackendTripTemplate>(`/trip-templates/${id}`, { method: 'PUT', body: payload })
    return mapToTemplate(result)
  }

  async function remove(id: string): Promise<void> {
    await api<void>(`/trip-templates/${id}`, { method: 'DELETE' })
  }

  return { list, create, update, remove }
}
