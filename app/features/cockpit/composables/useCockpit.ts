// app/features/cockpit/composables/useCockpit.ts
import { ref, computed } from 'vue'
import { cockpitService } from '@/features/cockpit/services/cockpitService'
import { bidsService } from '@/features/colis/services/bidsService'
import type { Analytics, CalendarStats, UrgentAction, KpiData, AnalyticsKpi } from '@/features/cockpit/types/index'
import type { Bid } from '@/features/colis/types/index'

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000
const TWENTYFOUR_HOURS_MS = 24 * 60 * 60 * 1000

export function useCockpit() {
  const analytics = ref<Analytics | null>(null)
  const calendarStats = ref<CalendarStats | null>(null)
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
      const [analyticsResult, calendarResult, bidsResult, automationCountResult] = await Promise.all([
        cockpit.fetchAnalytics(),
        cockpit.fetchCalendar(),
        bids.listBids({ statusFilter: 'PENDING' }),
        cockpit.fetchAutomationTodayCount(),
      ])
      analytics.value = analyticsResult
      calendarStats.value = calendarResult
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

    // Green: earnings summary — value already formatted by backend (e.g. "15.00 €")
    const revenueKpi = analytics.value?.kpis?.find((k: AnalyticsKpi) => k.id === 'revenue')
    const revenueStr = revenueKpi?.value ?? '0.00 €'
    const hasRevenue = !revenueStr.startsWith('0.00')
    actions.push({
      id: 'earnings',
      severity: 'green',
      label: `${revenueStr} de revenus nets ce mois`,
      detail: hasRevenue ? 'Bon travail ! Continuez ainsi.' : 'Aucun virement reçu ce mois.',
    })

    return actions
  })

  const kpis = computed<KpiData[]>(() => {
    const a = analytics.value
    const c = calendarStats.value
    const result: KpiData[] = []

    // KPIs from backend analytics (revenue, parcels, acceptance, rating…)
    if (a) {
      for (const k of a.kpis) {
        result.push({
          id: k.id,
          label: k.label,
          value: k.value,
          trend: (k.trend === 'up' || k.trend === 'down') ? k.trend : 'neutral',
          trendValue: k.trendValue ?? undefined,
        })
      }
    }

    // Trajets actifs / total from calendar stats
    result.push({
      id: 'trips',
      label: 'Trajets actifs / total',
      value: c ? `${c.activeTripsCount} / ${c.totalTripsThisMonth}` : '—',
      subLabel: 'ce mois',
    })

    // Actions requises = nombre de bids PENDING
    const actionsCount = pendingBids.value.length
    result.push({
      id: 'actions',
      label: 'Actions requises',
      value: a || c ? String(actionsCount) : '—',
      subLabel: 'bids en attente',
      trend: actionsCount > 0 ? 'up' : 'neutral',
    })

    return result
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
