import { useApi } from '@/composables/useApi'
import type {
  Trip,
  TripPage,
  TripFilter,
  CreateAnnouncementPayload,
} from '@/features/trajets/types/index'

export interface ListTripsParams {
  filter?: TripFilter
  page?: number
  size?: number
}

export function tripsService() {
  const api = useApi()

  async function listTrips(params: ListTripsParams = {}): Promise<TripPage> {
    const query: Record<string, string> = {}
    if (params.filter && params.filter !== 'TOUS') query.status = filterToStatus(params.filter)
    if (params.page !== undefined) query.page = String(params.page)
    if (params.size !== undefined) query.size = String(params.size)

    return api<TripPage>('/announcements', { query })
  }

  async function createAnnouncement(payload: CreateAnnouncementPayload): Promise<Trip> {
    return api<Trip>('/announcements', { method: 'POST', body: payload })
  }

  async function getTemplates(): Promise<Trip[]> {
    const page = await api<TripPage>('/announcements', {
      query: { size: '10', sort: 'createdAt,desc' },
    })
    return page.content
  }

  return { listTrips, createAnnouncement, getTemplates }
}

function filterToStatus(filter: TripFilter): string {
  const map: Record<Exclude<TripFilter, 'TOUS'>, string> = {
    ACTIFS: 'ACTIVE',
    A_VENIR: 'PUBLISHED',
    TERMINES: 'COMPLETED',
    ARCHIVES: 'ARCHIVED',
  }
  return map[filter as Exclude<TripFilter, 'TOUS'>]
}
