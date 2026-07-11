// app/features/search/services/searchService.ts
import { useApi } from '@/composables/useApi'
import type { GlobalSearchResults, SearchResultItem } from '@/features/search/types/index'

const RESULT_LIMIT = 5

const STATUS_LABELS: Record<string, string> = {
  AWAITING_PAYMENT: 'Paiement attendu',
  PENDING: 'En attente',
  PAYMENT_ESCROWED: 'À traiter',
  ACCEPTED: 'Accepté',
  HANDED_OVER: 'Remis',
  IN_TRANSIT: 'En transit',
  REJECTED: 'Refusé',
  CANCELLED: 'Annulé',
  COMPLETED: 'Livré',
  NO_SHOW: 'Absent',
  PARCEL_REFUSED: 'Colis refusé',
  EXPIRED: 'Expiré',
}

interface BackendBidSearchItem {
  id: string
  senderName: string | null
  description: string | null
  contentCategory: string | null
  status: string
  departureCity: string
  arrivalCity: string
}

interface BackendTripSearchItem {
  id: string
  departureCity: string
  arrivalCity: string
  departureDate: string
  confirmedParcelCount: number
}

interface BackendPage<T> {
  content: T[]
}

interface TrackingSearchResponse {
  trackingNumber: string
  bidId: string
  departureCity: string
  arrivalCity: string
  currentStep: string
  stepLabel: string
  paymentStatus: string
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Un code de suivi est court, sans espace, avec chiffres ou tirets (ex. DON-42X). */
export function looksLikeTrackingCode(q: string): boolean {
  const trimmed = q.trim()
  return trimmed.length >= 4 && !/\s/.test(trimmed) && /[0-9-]/.test(trimmed)
}

export function searchService() {
  const api = useApi()

  async function searchBids(q: string): Promise<SearchResultItem[]> {
    const page = await api<BackendPage<BackendBidSearchItem>>('/travelers/me/bids', {
      query: { q, size: String(RESULT_LIMIT) },
    })
    return page.content.map((b) => ({
      id: b.id,
      type: 'colis' as const,
      title: `${b.senderName ?? 'Expéditeur'} — ${b.description ?? b.contentCategory ?? 'Colis'}`,
      subtitle: `${b.departureCity} → ${b.arrivalCity} · ${statusLabel(b.status)}`,
      to: `/colis?bid=${b.id}`,
    }))
  }

  async function searchTrips(q: string): Promise<SearchResultItem[]> {
    const page = await api<BackendPage<BackendTripSearchItem>>('/announcements/my', {
      query: { q, size: String(RESULT_LIMIT) },
    })
    return page.content.map((t) => ({
      id: t.id,
      type: 'trajet' as const,
      title: `${t.departureCity} → ${t.arrivalCity}`,
      subtitle: `${formatDate(t.departureDate)} · ${t.confirmedParcelCount} colis confirmés`,
      to: `/trajets/${t.id}`,
    }))
  }

  async function searchTracking(code: string): Promise<SearchResultItem | null> {
    try {
      const res = await api<TrackingSearchResponse>('/tracking/search', {
        query: { number: code },
      })
      return {
        id: res.bidId,
        type: 'tracking',
        title: res.trackingNumber,
        subtitle: `${res.departureCity} → ${res.arrivalCity} · ${res.stepLabel}`,
        to: `/colis?bid=${res.bidId}`,
      }
    } catch {
      return null // code inconnu ou back indisponible : pas une erreur bloquante
    }
  }

  async function searchAll(q: string): Promise<GlobalSearchResults> {
    const query = q.trim()
    const [colis, trajets, tracking] = await Promise.all([
      searchBids(query).catch(() => []),
      searchTrips(query).catch(() => []),
      looksLikeTrackingCode(query) ? searchTracking(query) : Promise.resolve(null),
    ])
    return { colis, trajets, tracking }
  }

  return { searchBids, searchTrips, searchTracking, searchAll }
}
