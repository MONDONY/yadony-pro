import { useApi } from '@/composables/useApi'
import type { Bid, BidPage, BidFilter, BidStatus } from '@/features/colis/types/index'

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
  content: BackendBidResponse[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

function computeInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

function inferPaymentStatus(status: string): Bid['paymentStatus'] {
  if (status === 'COMPLETED') return 'RELEASED'
  if (['REJECTED', 'CANCELLED', 'NO_SHOW', 'PARCEL_REFUSED', 'EXPIRED'].includes(status)) return 'REFUNDED'
  if (['PAYMENT_ESCROWED', 'ACCEPTED', 'HANDED_OVER', 'IN_TRANSIT'].includes(status)) return 'ESCROWED'
  return 'PENDING'
}

function mapBackendToBid(b: BackendBidResponse): Bid {
  const weightKg = Number(b.weightKg)
  const pricePerKg = Number(b.pricePerKg)
  const paymentAmountEuros = Math.round(pricePerKg * weightKg * 100) / 100
  const earningsEuros = Math.round(paymentAmountEuros * 0.88 * 100) / 100
  const senderName = b.senderName ?? 'Expéditeur'

  return {
    id: b.id,
    status: b.status as BidStatus,
    tripId: b.announcementId,
    tripCorridor: `${b.departureCity} → ${b.arrivalCity}`,
    tripDepartureDate: b.departureDate,
    sender: {
      id: b.senderId,
      name: senderName,
      avatarInitials: computeInitials(senderName),
      rating: 0,
      totalSentParcels: b.senderTotalShipments ?? 0,
    },
    weightKg,
    contentDescription: b.description ?? b.contentCategory ?? '',
    declaredValueEuros: Number(b.declaredValueEur),
    earningsEuros,
    paymentStatus: inferPaymentStatus(b.status),
    paymentAmountEuros,
    history: [],
    createdAt: b.createdAt,
    expiresAt: null,
  }
}

export interface ListBidsParams {
  statusFilter?: BidFilter
  tripId?: string | null
}

export function bidsService() {
  const api = useApi()

  async function listBids(params: ListBidsParams = {}): Promise<BidPage> {
    const query: Record<string, string> = {}
    if (params.statusFilter && params.statusFilter !== 'TOUS') {
      query.status = params.statusFilter
    }
    if (params.tripId) query.tripId = params.tripId

    const page = await api<BackendPage>('/travelers/me/bids', { query })
    return {
      content: page.content.map(mapBackendToBid),
      totalElements: page.totalElements,
      totalPages: page.totalPages,
      number: page.number,
      size: page.size,
    }
  }

  async function acceptBid(id: string): Promise<Bid> {
    const res = await api<BackendBidResponse>(`/bids/${id}/accept`, { method: 'PUT' })
    return mapBackendToBid(res)
  }

  async function rejectBid(id: string): Promise<Bid> {
    const res = await api<BackendBidResponse>(`/bids/${id}/reject`, { method: 'PUT' })
    return mapBackendToBid(res)
  }

  return { listBids, acceptBid, rejectBid }
}
