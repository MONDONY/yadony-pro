// app/features/cockpit/composables/useCockpit.ts
import { ref, computed } from 'vue'
import { cockpitService } from '@/features/cockpit/services/cockpitService'
import { bidsService } from '@/features/colis/services/bidsService'
import type { TravelerStats, UrgentAction, KpiData } from '@/features/cockpit/types/index'
import type { Bid } from '@/features/colis/types/index'

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000
const TWENTYFOUR_HOURS_MS = 24 * 60 * 60 * 1000

function euros(n: number): string {
  return (n ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export function useCockpit() {
  const stats = ref<TravelerStats | null>(null)
  const pendingBids = ref<Bid[]>([])
  const automationCount = ref<number>(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const cockpit = cockpitService()
  const bids = bidsService()

  async function fetchAll(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const [statsResult, bidsResult, automationCountResult] = await Promise.all([
        cockpit.fetchStats(),
        bids.listBids({ statusFilter: 'PENDING' }),
        cockpit.fetchAutomationTodayCount(),
      ])
      stats.value = statsResult
      pendingBids.value = bidsResult.content
      automationCount.value = automationCountResult
    } catch {
      error.value = 'Impossible de charger le tableau de bord. Veuillez réessayer.'
    } finally {
      isLoading.value = false
    }
  }

  const urgentActions = computed<UrgentAction[]>(() => {
    // Return empty until first fetchAll completes
    if (stats.value === null && pendingBids.value.length === 0) {
      return []
    }

    const now = Date.now()
    const actions: UrgentAction[] = []

    // Red: bids expiring < 4h
    const expiring = pendingBids.value.filter(
      (b) =>
        b.expiresAt &&
        new Date(b.expiresAt).getTime() - now < FOUR_HOURS_MS &&
        new Date(b.expiresAt).getTime() > now,
    )
    if (expiring.length > 0) {
      actions.push({
        id: 'expiring',
        severity: 'red',
        label: `${expiring.length} bid${expiring.length > 1 ? 's' : ''} expirant dans < 4h`,
        detail: 'Répondez rapidement pour ne pas perdre ces opportunités.',
        actionLabel: 'Voir les bids',
        actionHref: '/colis',
      })
    }

    // Orange: bids pending > 24h
    const stale = pendingBids.value.filter(
      (b) => now - new Date(b.createdAt).getTime() > TWENTYFOUR_HOURS_MS && !expiring.includes(b),
    )
    if (stale.length > 0) {
      actions.push({
        id: 'stale',
        severity: 'orange',
        label: `${stale.length} bid${stale.length > 1 ? 's' : ''} en attente depuis > 24h`,
        detail: 'Ces expéditeurs attendent votre réponse.',
        actionLabel: 'Traiter',
        actionHref: '/colis',
      })
    }

    // Blue: automated actions today
    const n = automationCount.value
    actions.push({
      id: 'automations',
      severity: 'blue',
      label: `${n} action${n !== 1 ? 's' : ''} automatique${n !== 1 ? 's' : ''} ce jour`,
      detail: n > 0
        ? `${n} automatisation${n > 1 ? 's' : ''} déclenchée${n > 1 ? 's' : ''} aujourd'hui.`
        : "Aucune automatisation déclenchée aujourd'hui.",
    })

    // Green: earnings summary (revenus versés ce mois)
    const monthly = stats.value?.monthlyRevenue ?? 0
    actions.push({
      id: 'earnings',
      severity: 'green',
      label: `${euros(monthly)} de revenus nets ce mois`,
      detail: monthly > 0 ? 'Bon travail ! Continuez ainsi.' : 'Aucun virement reçu ce mois.',
    })

    return actions
  })

  // Vue d'ensemble TOUT-TEMPS (plus de scope mensuel) : revenus totaux + du mois,
  // trajets réalisés/actifs, colis livrés/en transit, taux d'acceptation, note, actions.
  const kpis = computed<KpiData[]>(() => {
    const s = stats.value
    if (!s) return []
    const acceptancePct = Math.round((s.acceptanceRate ?? 0) * 100)
    const pendingCount = pendingBids.value.length
    return [
      { id: 'revenue-total', label: 'Revenus nets', value: euros(s.totalRevenue), subLabel: 'tout temps' },
      { id: 'revenue-month', label: 'Revenus ce mois', value: euros(s.monthlyRevenue), subLabel: 'mois en cours' },
      { id: 'trips-completed', label: 'Trajets réalisés', value: String(s.totalTripsCompleted) },
      { id: 'active-trips', label: 'Trajets actifs', value: String(s.activeTrips), subLabel: 'en ligne' },
      { id: 'parcels-delivered', label: 'Colis livrés', value: String(s.totalParcelsDelivered) },
      { id: 'parcels-transit', label: 'Colis en transit', value: String(s.parcelsInTransit), subLabel: 'en cours' },
      { id: 'acceptance', label: 'Taux acceptation', value: `${acceptancePct}%` },
      {
        id: 'rating',
        label: 'Note moyenne',
        value: `${(s.averageRating ?? 0).toFixed(1)}/5`,
        subLabel: `${s.ratingCount} avis`,
      },
      {
        id: 'actions',
        label: 'Actions requises',
        value: String(pendingCount),
        subLabel: 'bids en attente',
        trend: pendingCount > 0 ? 'up' : 'neutral',
      },
    ]
  })

  return {
    stats,
    isLoading,
    error,
    urgentActions,
    kpis,
    fetchAll,
  }
}
