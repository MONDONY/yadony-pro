import { ref } from 'vue'
import { activityService } from '@/features/activite/services/activityService'
import type { KgSoldDetails, RevenueDetails, SummaryPeriod, TripsSummary } from '@/features/activite/types/index'

/**
 * Résumé d'activité du voyageur : chiffres clés, revenus par devise et kilos livrés
 * par trajet. Les trois appels partent ensemble ; un échec d'un détail n'empêche
 * pas d'afficher le reste.
 */
export function useTripsSummary() {
  const period = ref<SummaryPeriod>('30d')
  const summary = ref<TripsSummary | null>(null)
  const revenues = ref<RevenueDetails | null>(null)
  const kgSold = ref<KgSoldDetails | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const svc = activityService()

  async function fetchAll(): Promise<void> {
    isLoading.value = true
    error.value = null
    const requested = period.value
    try {
      const [s, r, k] = await Promise.allSettled([
        svc.fetchSummary(requested),
        svc.fetchRevenueDetails(requested),
        svc.fetchKgSoldDetails(requested),
      ])
      // Une réponse arrivée après un changement de période est périmée.
      if (period.value !== requested) return
      summary.value = s.status === 'fulfilled' ? s.value : null
      revenues.value = r.status === 'fulfilled' ? r.value : null
      kgSold.value = k.status === 'fulfilled' ? k.value : null
      if (s.status === 'rejected' && r.status === 'rejected' && k.status === 'rejected') {
        error.value = "Impossible de charger le résumé d'activité. Veuillez réessayer."
      }
    } finally {
      if (period.value === requested) isLoading.value = false
    }
  }

  async function setPeriod(p: SummaryPeriod): Promise<void> {
    period.value = p
    await fetchAll()
  }

  return { period, summary, revenues, kgSold, isLoading, error, fetchAll, setPeriod }
}
