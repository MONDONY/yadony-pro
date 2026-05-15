// app/features/cockpit/composables/useCockpit.ts
import { ref, computed } from 'vue'
import { cockpitService } from '@/features/cockpit/services/cockpitService'
import { bidsService } from '@/features/colis/services/bidsService'
import type { Analytics, CalendarStats, UrgentAction, KpiData } from '@/features/cockpit/types/index'
import type { Bid } from '@/features/colis/types/index'

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000
const TWENTYFOUR_HOURS_MS = 24 * 60 * 60 * 1000

export function useCockpit() {
  const analytics = ref<Analytics | null>(null)
  const calendarStats = ref<CalendarStats | null>(null)
  const pendingBids = ref<Bid[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const cockpit = cockpitService()
  const bids = bidsService()

  async function fetchAll(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const [analyticsResult, calendarResult, bidsResult] = await Promise.all([
        cockpit.fetchAnalytics(),
        cockpit.fetchCalendar(),
        bids.listBids({ statusFilter: 'PENDING' }),
      ])
      analytics.value = analyticsResult
      calendarStats.value = calendarResult
      pendingBids.value = bidsResult.content
    } catch {
      error.value = 'Impossible de charger le tableau de bord. Veuillez réessayer.'
    } finally {
      isLoading.value = false
    }
  }

  const urgentActions = computed<UrgentAction[]>(() => {
    // Return empty until first fetchAll completes
    if (analytics.value === null && calendarStats.value === null && pendingBids.value.length === 0) {
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
      (b) =>
        now - new Date(b.createdAt).getTime() > TWENTYFOUR_HOURS_MS && !expiring.includes(b),
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

    // Blue: automated actions (static for now)
    actions.push({
      id: 'automations',
      severity: 'blue',
      label: "0 actions automatiques ce jour",
      detail: "Aucune automatisation déclenchée aujourd'hui.",
    })

    // Green: earnings summary
    const monthRevenue = analytics.value?.revenueNetCurrentMonth ?? 0
    actions.push({
      id: 'earnings',
      severity: 'green',
      label: `${monthRevenue.toFixed(2)} € de revenus nets ce mois`,
      detail: monthRevenue > 0 ? 'Bon travail ! Continuez ainsi.' : 'Aucun virement reçu ce mois.',
    })

    return actions
  })

  const kpis = computed<KpiData[]>(() => {
    const a = analytics.value
    const c = calendarStats.value
    return [
      {
        id: 'revenue',
        label: 'Revenus nets ce mois',
        value: a ? `${a.revenueNetCurrentMonth.toFixed(2)} €` : '—',
        trend: 'neutral',
      },
      {
        id: 'trips',
        label: 'Trajets actifs / total',
        value: c ? `${c.activeTripsCount} / ${c.totalTripsThisMonth}` : '—',
        subLabel: 'ce mois',
      },
      {
        id: 'colis',
        label: 'Colis gérés',
        value: a ? String(a.colisGeres) : '—',
        subLabel: 'confirmés + en attente',
      },
      {
        id: 'actions',
        label: 'Actions requises',
        value: a ? String(a.actionsRequises) : '—',
        subLabel: 'bids + capacité',
        trend: a && a.actionsRequises > 0 ? 'up' : 'neutral',
      },
      {
        id: 'rating',
        label: 'Note moyenne',
        value: a ? `${a.averageRating.toFixed(1)} / 5` : '—',
        trend: a && a.averageRating >= 4.5 ? 'up' : a && a.averageRating < 4 ? 'down' : 'neutral',
      },
    ]
  })

  return {
    analytics,
    calendarStats,
    isLoading,
    error,
    urgentActions,
    kpis,
    fetchAll,
  }
}
