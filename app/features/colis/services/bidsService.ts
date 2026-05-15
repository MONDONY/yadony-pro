import { useApi } from '@/composables/useApi'
import type { Bid, BidPage, BidFilter } from '@/features/colis/types/index'

export interface ListBidsParams {
  statusFilter?: BidFilter
  tripId?: string | null
  senderSearch?: string
  dateFrom?: string | null
  dateTo?: string | null
}

export function bidsService() {
  const api = useApi()

  async function listBids(params: ListBidsParams = {}): Promise<BidPage> {
    const query: Record<string, string> = { travelerId: 'me' }
    if (params.statusFilter && params.statusFilter !== 'TOUS') {
      query.status = params.statusFilter
    }
    if (params.tripId) query.tripId = params.tripId
    if (params.senderSearch) query.senderSearch = params.senderSearch
    if (params.dateFrom) query.dateFrom = params.dateFrom
    if (params.dateTo) query.dateTo = params.dateTo
    return api<BidPage>('/bids', { query })
  }

  async function acceptBid(id: string): Promise<Bid> {
    return api<Bid>(`/bids/${id}/accept`, { method: 'PUT' })
  }

  async function rejectBid(id: string): Promise<Bid> {
    return api<Bid>(`/bids/${id}/reject`, { method: 'PUT' })
  }

  return { listBids, acceptBid, rejectBid }
}
