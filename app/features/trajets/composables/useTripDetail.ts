import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { tripsService } from '@/features/trajets/services/tripsService'
import { useCommissionRate, FALLBACK_COMMISSION_RATE } from '@/composables/useCommissionRate'
import type { Trip, TripBid, TripKpis } from '@/features/trajets/types/index'

export function useTripDetail(tripId: string) {
  const trip = ref<Trip | null>(null)
  const bids = ref<TripBid[]>([])
  const isLoading = ref(false)
  const bidsLoading = ref(false)
  const error = ref<string | null>(null)
  const deleteLoading = ref(false)
  const commissionRate = ref(FALLBACK_COMMISSION_RATE)

  const svc = tripsService()
  const router = useRouter()
  const { getRate } = useCommissionRate()

  async function fetchTrip(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const [t, rate] = await Promise.all([svc.getAnnouncement(tripId), getRate()])
      trip.value = t
      commissionRate.value = rate
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

  async function confirmPresence(bidId: string): Promise<void> {
    await svc.confirmPresence(bidId)
    await fetchBids()
    await fetchTrip()
  }

  async function refuseParcel(bidId: string, reason: string, photo: File | null = null): Promise<void> {
    let photoUrl: string | null = null
    if (photo) {
      try {
        photoUrl = await svc.uploadRefusalPhoto(bidId, photo)
      } catch {
        // La photo est une preuve optionnelle : un échec d'upload ne doit pas bloquer le refus.
        photoUrl = null
      }
    }
    await svc.refuseParcel(bidId, reason, photoUrl)
    await fetchBids()
    await fetchTrip()
  }

  async function cancelBid(bidId: string): Promise<void> {
    await svc.cancelBid(bidId)
    await fetchBids()
    await fetchTrip()
  }

  async function markTrackingEvent(
    bidId: string,
    eventType: 'DEPART' | 'TRANSIT' | 'ARRIVEE',
  ): Promise<void> {
    await svc.postTrackingEvent(bidId, eventType)
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
    const commission = Math.round(gross * commissionRate.value * 100) / 100
    const net = Math.round(gross * (1 - commissionRate.value) * 100) / 100
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
    confirmPresence,
    refuseParcel,
    cancelBid,
    markTrackingEvent,
    exportBidsCsv,
  }
}
