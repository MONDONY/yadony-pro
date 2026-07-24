import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { tripsService } from '@/features/trajets/services/tripsService'
import { cancellationService } from '@/features/cancellation/services/cancellationService'
import { useCommissionRate, FALLBACK_COMMISSION_RATE } from '@/composables/useCommissionRate'
import { extractProblem } from '@/lib/apiError'
import type { Trip, TripBid, TripKpis } from '@/features/trajets/types/index'

const publishErrorMessages: Record<string, string> = {
  'kyc-not-verified': 'Vérifiez votre identité avant de publier ce trajet.',
  'departure-date-passed': 'La date de départ est passée. Modifiez le trajet avant de publier.',
  'pro-limit-reached': 'Limite mensuelle d’annonces atteinte. Passez en PRO pour publier davantage.',
  'publishing-suspended': 'La publication est suspendue sur votre compte. Contactez le support.',
  'not-a-draft': 'Ce trajet n’est pas un brouillon.',
}

export function useTripDetail(tripId: string) {
  const trip = ref<Trip | null>(null)
  const bids = ref<TripBid[]>([])
  const isLoading = ref(false)
  const bidsLoading = ref(false)
  const error = ref<string | null>(null)
  const deleteLoading = ref(false)
  const publishLoading = ref(false)
  const publishError = ref<string | null>(null)
  const publishErrorCode = ref<string | null>(null)
  const commissionRate = ref(FALLBACK_COMMISSION_RATE)

  const svc = tripsService()
  const cancellationSvc = cancellationService()
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

  async function publishTrip(): Promise<void> {
    publishLoading.value = true
    publishError.value = null
    publishErrorCode.value = null
    try {
      await svc.publishAnnouncement(tripId)
      await fetchTrip()
    } catch (e) {
      const { code, detail } = extractProblem(e)
      publishErrorCode.value = code
      publishError.value =
        (code && publishErrorMessages[code]) || detail || 'Impossible de publier ce trajet.'
    } finally {
      publishLoading.value = false
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

  // L'expéditeur ne s'est pas présenté à la remise → NO_SHOW.
  async function reportNoShow(bidId: string): Promise<void> {
    await cancellationSvc.reportNoShow(bidId)
    await fetchBids()
    await fetchTrip()
  }

  // Annulation d'un colis déjà remis → retour à organiser.
  async function cancelAfterHandover(bidId: string): Promise<void> {
    await cancellationSvc.cancelAfterHandover(bidId)
    await fetchBids()
    await fetchTrip()
  }

  // Confirme le retour du colis avec le code fourni par l'expéditeur.
  async function confirmReturn(bidId: string, returnCode: string): Promise<void> {
    await cancellationSvc.confirmReturn(bidId, returnCode)
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
    publishLoading,
    publishError,
    publishErrorCode,
    kpis,
    fetchTrip,
    fetchBids,
    deleteTrip,
    publishTrip,
    acceptBid,
    rejectBid,
    confirmDelivery,
    confirmPresence,
    refuseParcel,
    cancelBid,
    markTrackingEvent,
    reportNoShow,
    cancelAfterHandover,
    confirmReturn,
    exportBidsCsv,
  }
}
