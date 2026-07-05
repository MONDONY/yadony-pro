import { describe, it, expect, vi, beforeEach } from 'vitest'

// useApi() renvoie une instance ofetch appelable directement — api(url, opts) —
// et non un objet avec des méthodes .get/.post.
const mockApi = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApi,
}))

async function importService() {
  const mod = await import('@/features/activite/services/activityService')
  return mod.activityService
}

const fakeAnalytics = {
  period: 'month' as const,
  kpis: [{ id: 'revenue', label: 'Revenus nets', value: '1 200 €' }],
  transactions: [],
}

describe('activityService', () => {
  beforeEach(() => {
    vi.resetModules()
    mockApi.mockReset()
  })

  it('fetchAnalytics calls GET /travelers/me/analytics with period param', async () => {
    mockApi.mockResolvedValue(fakeAnalytics)
    const activityService = await importService()
    const svc = activityService()
    await svc.fetchAnalytics('month')
    expect(mockApi).toHaveBeenCalledWith('/travelers/me/analytics', {
      query: { period: 'month' },
    })
  })

  it('fetchAnalytics returns ActivityAnalytics', async () => {
    mockApi.mockResolvedValue(fakeAnalytics)
    const activityService = await importService()
    const svc = activityService()
    const result = await svc.fetchAnalytics('month')
    expect(result.period).toBe('month')
    expect(result.kpis).toHaveLength(1)
  })

  it('fetchAnalytics passes quarter period', async () => {
    mockApi.mockResolvedValue({ ...fakeAnalytics, period: 'quarter' })
    const activityService = await importService()
    const svc = activityService()
    await svc.fetchAnalytics('quarter')
    expect(mockApi).toHaveBeenCalledWith('/travelers/me/analytics', {
      query: { period: 'quarter' },
    })
  })

  it('downloadFiscalExport calls GET /travelers/me/fiscal-export with correct params', async () => {
    const fakeBlob = new Blob(['data'], { type: 'application/pdf' })
    mockApi.mockResolvedValue(fakeBlob)
    const activityService = await importService()
    const svc = activityService()
    await svc.downloadFiscalExport(2026, 'pdf', 'summary')
    expect(mockApi).toHaveBeenCalledWith('/travelers/me/fiscal-export', {
      query: { year: 2026, format: 'pdf', type: 'summary' },
      responseType: 'blob',
    })
  })

  it('downloadFiscalExport returns a Blob', async () => {
    const fakeBlob = new Blob(['data'], { type: 'text/csv' })
    mockApi.mockResolvedValue(fakeBlob)
    const activityService = await importService()
    const svc = activityService()
    const result = await svc.downloadFiscalExport(2026, 'csv', 'transactions')
    expect(result).toBeInstanceOf(Blob)
  })
})
