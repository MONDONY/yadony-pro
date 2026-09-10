import { useApi } from '@/composables/useApi'
import { useCommissionRate } from '@/composables/useCommissionRate'
import type { Bid, BidPage, BidFilter, BidStatus } from '@/features/colis/types/index'
import { normalizeCurrency, roundToCurrency } from '@/lib/money'

interface BackendBidResponse {
  id: string
  announcementId: string
  senderId: string
  senderName: string | null
  senderTotalShipments: number | null
  weightKg: number
  description: string | null
  contentCategory: string | null
  status: string
  departureCity: string
  arrivalCity: string
  departureDate: string
  pricePerKg: number
  createdAt: string
  paymentMethod: string | null
  trackingNumber: string | null
  trackingToken: string | null
  /** Devise du bid ; les montants « Eur » ci-dessous s'y expriment malgré leur nom. */
  currency?: string | null
  /** Net voyageur calculé par le backend (négocié, grille, taux figé). */
  totalNetAmountEur?: number | null
  /** Brut payé par l'expéditeur, calculé par le backend. */
  totalSenderAmountEur?: number | null
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

function finiteOrNull(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  return value !== null && value !== undefined && Number.isFinite(n) ? n : null
}

function mapBackendToBid(b: BackendBidResponse, commissionRate: number): Bid {
  const currency = normalizeCurrency(b.currency)
  // Le poids peut être absent (mode GRID) ou null (bid rejeté sans pesée) → on
  // n'invente pas de 0 : weightKg reste null et les revenus qui en dépendent aussi
  // (évite les « NaN kg » / « NaN € » à l'affichage).
  const rawWeight = Number(b.weightKg)
  const weightKg = Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : null
  const pricePerKg = Number(b.pricePerKg)
  // Montants du backend d'abord : ils portent l'accord négocié, la grille et le
  // taux figé sur le bid. Le produit prix/kg × poids × (1 − taux global) ne
  // sert plus que de repli, arrondi à la précision de la devise.
  const localGross =
    weightKg !== null && Number.isFinite(pricePerKg)
      ? roundToCurrency(pricePerKg * weightKg, currency)
      : null
  const paymentAmountEuros = finiteOrNull(b.totalSenderAmountEur) ?? localGross
  const earningsEuros =
    finiteOrNull(b.totalNetAmountEur)
    ?? (localGross !== null ? roundToCurrency(localGross * (1 - commissionRate), currency) : null)
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
    currency,
    earningsEuros,
    paymentStatus: inferPaymentStatus(b.status),
    paymentAmountEuros,
    history: [],
    createdAt: b.createdAt,
    expiresAt: null,
    trackingNumber: b.trackingNumber ?? null,
    trackingToken: b.trackingToken ?? null,
  }
}

export interface ListBidsParams {
  statusFilter?: BidFilter
  tripId?: string | null
  q?: string | null
  page?: number
  size?: number
}

export function bidsService() {
  const api = useApi()
  const { getRate } = useCommissionRate()

  async function listBids(params: ListBidsParams = {}): Promise<BidPage> {
    const query: Record<string, string> = {}
    if (params.statusFilter && params.statusFilter !== 'TOUS') {
      query.status = params.statusFilter
    }
    if (params.tripId) query.tripId = params.tripId
    if (params.q && params.q.trim()) query.q = params.q.trim()
    if (params.page !== undefined) query.page = String(params.page)
    if (params.size !== undefined) query.size = String(params.size)

    const [page, rate] = await Promise.all([
      api<BackendPage>('/travelers/me/bids', { query }),
      getRate(),
    ])
    return {
      content: page.content.map((b) => mapBackendToBid(b, rate)),
      totalElements: page.totalElements,
      totalPages: page.totalPages,
      number: page.number,
      size: page.size,
    }
  }

  async function getBid(id: string): Promise<Bid> {
    const [res, rate] = await Promise.all([api<BackendBidResponse>(`/bids/${id}`, {}), getRate()])
    return mapBackendToBid(res, rate)
  }

  async function acceptBid(id: string): Promise<Bid> {
    const [res, rate] = await Promise.all([
      api<BackendBidResponse>(`/bids/${id}/accept`, { method: 'PUT' }),
      getRate(),
    ])
    return mapBackendToBid(res, rate)
  }

  async function rejectBid(id: string): Promise<Bid> {
    const [res, rate] = await Promise.all([
      api<BackendBidResponse>(`/bids/${id}/reject`, { method: 'PUT' }),
      getRate(),
    ])
    return mapBackendToBid(res, rate)
  }

  return { listBids, getBid, acceptBid, rejectBid }
}
