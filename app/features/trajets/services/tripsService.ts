import { useApi } from '@/composables/useApi'
import { useCommissionRate } from '@/composables/useCommissionRate'
import type {
  TrackingEvent,
  QrCode,
  Trip,
  TripBid,
  TripPage,
  TripFilter,
  CorridorOption,
  CreateAnnouncementPayload,
} from '@/features/trajets/types/index'

export interface ListTripsParams {
  filter?: TripFilter
  q?: string | null
  date?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  departure?: string | null
  arrival?: string | null
  page?: number
  size?: number
}

interface BackendAddress {
  label: string
  lat: number
  lng: number
}

interface BackendAnnouncementResponse {
  id: string
  travelerId: string
  departureCity: string
  arrivalCity: string
  departureDate: string
  departureTime: string | null
  arrivalTime: string | null
  pickupAddress: BackendAddress
  deliveryAddress: BackendAddress
  availableKg: number
  totalKg: number
  pricePerKg: number
  transportMode: Trip['transportMode']
  status: Trip['status']
  pendingBidCount: number
  confirmedParcelCount: number
  senderNote: string | null
  acceptedContentTypes: string[]
  refusedTypes: string[]
  acceptedPaymentMethods: string[]
  cashAccepted: boolean
  handoverWindowStart: string | null
  handoverWindowEnd: string | null
  createdAt: string
  updatedAt: string
}

interface BackendAnnouncementDetailResponse extends BackendAnnouncementResponse {
  bidsCount: number
  traveler: unknown
}

interface BackendBidResponse {
  id: string
  announcementId: string
  senderId: string
  senderName: string | null
  senderTotalShipments: number | null
  weightKg: number
  declaredValueEur: number
  description: string | null
  contentCategory: string | null
  status: string
  departureCity: string
  arrivalCity: string
  departureDate: string
  pricePerKg: number
  createdAt: string
  paymentMethod: string | null
}

interface BackendPage {
  content: BackendAnnouncementResponse[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

function mapBackendToTrip(a: BackendAnnouncementResponse): Trip {
  return {
    id: a.id,
    status: a.status,
    departureCity: { placeId: '', label: a.departureCity, lat: 0, lng: 0 },
    arrivalCity: { placeId: '', label: a.arrivalCity, lat: 0, lng: 0 },
    departureDate: a.departureDate,
    departureTime: a.departureTime,
    arrivalTime: a.arrivalTime,
    transportMode: a.transportMode,
    pickupPlace: { placeId: '', label: a.pickupAddress.label, lat: a.pickupAddress.lat, lng: a.pickupAddress.lng },
    dropoffPlace: { placeId: '', label: a.deliveryAddress.label, lat: a.deliveryAddress.lat, lng: a.deliveryAddress.lng },
    availableWeightKg: a.availableKg,
    usedWeightKg: a.totalKg - a.availableKg,
    pricePerKg: a.pricePerKg,
    acceptedCategories: a.acceptedContentTypes,
    refusedCategories: a.refusedTypes,
    senderNote: a.senderNote ?? null,
    cashAccepted: a.cashAccepted ?? (a.acceptedPaymentMethods?.includes('CASH') ?? false),
    handoverWindowStart: a.handoverWindowStart ?? null,
    handoverWindowEnd: a.handoverWindowEnd ?? null,
    confirmedParcelCount: a.confirmedParcelCount,
    pendingBidCount: a.pendingBidCount,
    reservedRevenueEuros: 0,
    createdAt: a.createdAt,
  }
}

function mapBidResponseToTripBid(b: BackendBidResponse, commissionRate: number): TripBid {
  const weightKg = Number(b.weightKg) || 0
  const pricePerKg = Number(b.pricePerKg) || 0
  const paymentAmountEuros = Math.round(pricePerKg * weightKg * 100) / 100
  const earningsEuros = Math.round(paymentAmountEuros * (1 - commissionRate) * 100) / 100
  const senderName = b.senderName ?? 'Expéditeur'
  const senderInitials = senderName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
  return {
    id: b.id,
    senderId: b.senderId,
    senderName,
    senderInitials,
    senderTotalShipments: b.senderTotalShipments ?? 0,
    weightKg,
    declaredValueEuros: Number(b.declaredValueEur),
    contentDescription: b.description ?? b.contentCategory ?? '',
    status: b.status,
    paymentAmountEuros,
    earningsEuros,
    paymentMethod: b.paymentMethod,
    createdAt: b.createdAt,
  }
}

export function tripsService() {
  const api = useApi()
  const { getRate } = useCommissionRate()

  async function getCorridors(): Promise<CorridorOption[]> {
    const result = await api<Array<{ departure: string; arrival: string }>>('/announcements/my/corridors', {})
    return result.map((c) => ({ departure: c.departure, arrival: c.arrival }))
  }

  async function listTrips(params: ListTripsParams = {}): Promise<TripPage> {
    const query: Record<string, string> = {}
    if (params.filter && params.filter !== 'TOUS') query.status = filterToStatus(params.filter)
    if (params.q && params.q.trim()) query.q = params.q.trim()
    if (params.date) query.date = params.date
    if (params.dateFrom) query.dateFrom = params.dateFrom
    if (params.dateTo) query.dateTo = params.dateTo
    if (params.departure) query.departure = params.departure
    if (params.arrival) query.arrival = params.arrival
    if (params.page !== undefined) query.page = String(params.page)
    if (params.size !== undefined) query.size = String(params.size)

    const page = await api<BackendPage>('/announcements/my', { query })
    return {
      content: page.content.map(mapBackendToTrip),
      totalElements: page.totalElements,
      totalPages: page.totalPages,
      number: page.number,
      size: page.size,
    }
  }

  async function createAnnouncement(
    payload: CreateAnnouncementPayload,
    opts?: { saveAsDraft?: boolean },
  ): Promise<Trip> {
    const body = opts?.saveAsDraft ? { ...payload, saveAsDraft: true } : payload
    const result = await api<BackendAnnouncementResponse>('/announcements', { method: 'POST', body })
    return mapBackendToTrip(result)
  }

  async function publishAnnouncement(id: string): Promise<Trip> {
    const result = await api<BackendAnnouncementResponse>(`/announcements/${id}/publish`, { method: 'POST' })
    return mapBackendToTrip(result)
  }

  async function getTemplates(): Promise<Trip[]> {
    const page = await api<BackendPage>('/announcements/my', {
      query: { size: '10', sort: 'createdAt,desc' },
    })
    return page.content.map(mapBackendToTrip)
  }

  async function getAnnouncement(id: string): Promise<Trip> {
    const result = await api<BackendAnnouncementDetailResponse>(`/announcements/${id}`, {})
    return mapBackendToTrip(result)
  }

  async function updateAnnouncement(id: string, payload: CreateAnnouncementPayload): Promise<Trip> {
    const result = await api<BackendAnnouncementDetailResponse>(`/announcements/${id}`, { method: 'PUT', body: payload })
    return mapBackendToTrip(result)
  }

  async function deleteAnnouncement(id: string): Promise<void> {
    await api<void>(`/announcements/${id}`, { method: 'DELETE' })
  }

  async function getAnnouncementBids(id: string): Promise<TripBid[]> {
    const [bids, rate] = await Promise.all([
      api<BackendBidResponse[]>(`/announcements/${id}/bids`, {}),
      getRate(),
    ])
    return bids.map((b) => mapBidResponseToTripBid(b, rate))
  }

  async function acceptBid(bidId: string): Promise<void> {
    await api<void>(`/bids/${bidId}/accept`, { method: 'PUT' })
  }

  async function rejectBid(bidId: string): Promise<void> {
    await api<void>(`/bids/${bidId}/reject`, { method: 'PUT' })
  }

  async function confirmDelivery(bidId: string, code: string): Promise<void> {
    await api<void>(`/tracking/${bidId}/confirm-delivery`, { method: 'POST', body: { confirmationCode: code } })
  }

  // Le voyageur confirme sa présence pour la remise (colis ACCEPTED).
  async function confirmPresence(bidId: string): Promise<void> {
    await api<void>(`/bids/${bidId}/confirm-presence`, { method: 'PUT' })
  }

  // Refus du colis à l'inspection (ACCEPTED ou HANDED_OVER) → PARCEL_REFUSED.
  async function refuseParcel(bidId: string, reason: string, refusalPhotoUrl: string | null = null): Promise<void> {
    await api<void>(`/bids/${bidId}/refuse-parcel`, {
      method: 'POST',
      body: { reason, refusalPhotoUrl },
    })
  }

  // Photo de preuve jointe au refus — uploadée sous tracking/{bidId}/.
  async function uploadRefusalPhoto(bidId: string, file: File): Promise<string> {
    const form = new FormData()
    form.append('file', file)
    form.append('bidId', bidId)
    const res = await api<{ key: string; url: string }>('/storage/upload/tracking', {
      method: 'POST',
      body: form,
    })
    return res.url
  }

  // Le voyageur se désiste d'un colis avant remise → CANCELLED (remboursement expéditeur).
  async function cancelBid(bidId: string): Promise<void> {
    await api<void>(`/bids/${bidId}/cancel`, { method: 'PUT' })
  }

  async function postTrackingEvent(bidId: string, eventType: 'DEPART' | 'TRANSIT' | 'ARRIVEE'): Promise<void> {
    await api<void>('/tracking/events', { method: 'POST', body: { bidId, eventType } })
  }

  async function getTrackingEvents(bidId: string): Promise<TrackingEvent[]> {
    return api<TrackingEvent[]>(`/tracking/${bidId}/events`, {})
  }

  async function getQrCode(bidId: string): Promise<QrCode> {
    return api<QrCode>(`/tracking/${bidId}/qr-code`, {})
  }

  return {
    listTrips, getCorridors, createAnnouncement, publishAnnouncement, getTemplates, getAnnouncement,
    updateAnnouncement, deleteAnnouncement, getAnnouncementBids, acceptBid, rejectBid,
    confirmDelivery, confirmPresence, refuseParcel, uploadRefusalPhoto, cancelBid,
    postTrackingEvent, getTrackingEvents, getQrCode,
  }
}

function filterToStatus(filter: TripFilter): string {
  const map: Record<Exclude<TripFilter, 'TOUS'>, string> = {
    ACTIFS: 'ACTIVE',
    COMPLETS: 'FULL',
    EN_COURS: 'IN_PROGRESS',
    TERMINES: 'COMPLETED',
    ANNULES: 'CANCELLED',
    BROUILLONS: 'DRAFT',
  }
  return map[filter as Exclude<TripFilter, 'TOUS'>]
}
