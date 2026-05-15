import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    get: mockGet,
  }),
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
    mockGet.mockReset()
  })

  it('fetchAnalytics calls GET /travelers/me/analytics with period param', async () => {
    mockGet.mockResolvedValue(fakeAnalytics)
    const activityService = await importService()
    const svc = activityService()
    await svc.fetchAnalytics('month')
    expect(mockGet).toHaveBeenCalledWith('/travelers/me/analytics', {
      params: { period: 'month' },
    })
  })

  it('fetchAnalytics returns ActivityAnalytics', async () => {
    mockGet.mockResolvedValue(fakeAnalytics)
    const activityService = await importService()
    const svc = activityService()
    const result = await svc.fetchAnalytics('month')
    expect(result.period).toBe('month')
    expect(result.kpis).toHaveLength(1)
  })

  it('fetchAnalytics passes quarter period', async () => {
    mockGet.mockResolvedValue({ ...fakeAnalytics, period: 'quarter' })
    const activityService = await importService()
    const svc = activityService()
    await svc.fetchAnalytics('quarter')
    expect(mockGet).toHaveBeenCalledWith('/travelers/me/analytics', {
      params: { period: 'quarter' },
    })
  })

  it('downloadFiscalExport calls GET /travelers/me/fiscal-export with correct params', async () => {
    const fakeBlob = new Blob(['data'], { type: 'application/pdf' })
    mockGet.mockResolvedValue(fakeBlob)
    const activityService = await importService()
    const svc = activityService()
    await svc.downloadFiscalExport(2026, 'pdf', 'summary')
    expect(mockGet).toHaveBeenCalledWith('/travelers/me/fiscal-export', {
      params: { year: 2026, format: 'pdf', type: 'summary' },
      responseType: 'blob',
    })
  })

  it('downloadFiscalExport returns a Blob', async () => {
    const fakeBlob = new Blob(['data'], { type: 'text/csv' })
    mockGet.mockResolvedValue(fakeBlob)
    const activityService = await importService()
    const svc = activityService()
    const result = await svc.downloadFiscalExport(2026, 'csv', 'transactions')
    expect(result).toBeInstanceOf(Blob)
  })
})
