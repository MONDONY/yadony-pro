import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { tripsService } from '@/features/trajets/services/tripsService'
import type { Trip, TripBid, TripKpis } from '@/features/trajets/types/index'

export function useTripDetail(tripId: string) {
  const trip = ref<Trip | null>(null)
  const bids = ref<TripBid[]>([])
  const isLoading = ref(false)
  const bidsLoading = ref(false)
  const error = ref<string | null>(null)
  const deleteLoading = ref(false)

  const svc = tripsService()
  const router = useRouter()

  async function fetchTrip(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      trip.value = await svc.getAnnouncement(tripId)
    } catch {
      error.value = 'Impossible de charger ce trajet.'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchBids(): Promise<void> {
    bidsLoading.value = true
    try {
      bids.value = await svc.getAnnouncementBids(tripId)
    } catch {
      // non-fatal
    } finally {
      bidsLoading.value = false
    }
  }

  async function deleteTrip(): Promise<void> {
    deleteLoading.value = true
    try {
      await svc.deleteAnnouncement(tripId)
      router.push('/trajets')
    } catch {
      error.value = 'Impossible de supprimer ce trajet.'
    } finally {
      deleteLoading.value = false
    }
  }

  async function acceptBid(bidId: string): Promise<void> {
    await svc.acceptBid(bidId)
    await fetchBids()
    await fetchTrip()
  }

  async function rejectBid(bidId: string): Promise<void> {
    await svc.rejectBid(bidId)
    await fetchBids()
    await fetchTrip()
  }

  async function confirmDelivery(bidId: string, code: string): Promise<void> {
    await svc.confirmDelivery(bidId, code)
    await fetchBids()
    await fetchTrip()
  }

  const kpis = computed<TripKpis>(() => {
    const t = trip.value
    if (!t) return { fillRatePct: 0, grossRevenueEuros: 0, commissionEuros: 0, netRevenueEuros: 0, revenuePerKg: 0 }
    const confirmed = bids.value.filter((b) =>
      ['ACCEPTED', 'HANDED_OVER', 'IN_TRANSIT', 'COMPLETED'].includes(b.status),
    )
    const gross = confirmed.reduce((sum, b) => sum + b.paymentAmountEuros, 0)
    const commission = Math.round(gross * 0.12 * 100) / 100
    const net = Math.round(gross * 0.88 * 100) / 100
    const used = t.usedWeightKg
    return {
      fillRatePct: t.availableWeightKg > 0 ? Math.round((used / t.availableWeightKg) * 100) : 0,
      grossRevenueEuros: Math.round(gross * 100) / 100,
      commissionEuros: commission,
      netRevenueEuros: net,
      revenuePerKg: used > 0 ? Math.round((net / used) * 100) / 100 : 0,
    }
  })

  function exportBidsCsv(): string {
    const header = 'id,expéditeur,envois,poids (kg),valeur déclarée (€),statut,revenus nets (€),créé le'
    const rows = bids.value.map((b) =>
      [
        b.id,
        `"${b.senderName}"`,
        b.senderTotalShipments,
        b.weightKg,
        b.declaredValueEuros,
        b.status,
        b.earningsEuros,
        new Date(b.createdAt).toLocaleDateString('fr-FR'),
      ].join(','),
    )
    return [header, ...rows].join('\n')
  }

  return {
    trip,
    bids,
    isLoading,
    bidsLoading,
    error,
    deleteLoading,
    kpis,
    fetchTrip,
    fetchBids,
    deleteTrip,
    acceptBid,
    rejectBid,
    confirmDelivery,
    exportBidsCsv,
  }
}
