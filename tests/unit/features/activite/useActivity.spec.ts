import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetchAnalytics = vi.fn()
const mockDownloadFiscalExport = vi.fn()

vi.mock('@/features/activite/services/activityService', () => ({
  activityService: () => ({
    fetchAnalytics: mockFetchAnalytics,
    downloadFiscalExport: mockDownloadFiscalExport,
  }),
}))

// Mock URL.createObjectURL and URL.revokeObjectURL for download tests
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = vi.fn()
globalThis.URL.createObjectURL = mockCreateObjectURL
globalThis.URL.revokeObjectURL = mockRevokeObjectURL

async function importUseActivity() {
  const mod = await import('@/features/activite/composables/useActivity')
  return mod.useActivity
}

const fakeAnalytics = {
  period: 'month' as const,
  kpis: [{ id: 'revenue', label: 'Revenus nets', value: '1 200 €' }],
  transactions: [],
}

describe('useActivity', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetchAnalytics.mockReset()
    mockDownloadFiscalExport.mockReset()
    mockCreateObjectURL.mockReset()
    mockRevokeObjectURL.mockReset()
    mockCreateObjectURL.mockReturnValue('blob:mock-url')
  })

  it('initial state: analytics null, isLoading false, period month', async () => {
    const useActivity = await importUseActivity()
    const { analytics, isLoading, error, period } = useActivity()
    expect(analytics.value).toBeNull()
    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(period.value).toBe('month')
  })

  it('fetchAnalytics populates analytics on success', async () => {
    mockFetchAnalytics.mockResolvedValue(fakeAnalytics)
    const useActivity = await importUseActivity()
    const { analytics, fetchAnalytics } = useActivity()
    await fetchAnalytics()
    expect(analytics.value).toEqual(fakeAnalytics)
  })

  it('fetchAnalytics calls service with current period', async () => {
    mockFetchAnalytics.mockResolvedValue(fakeAnalytics)
    const useActivity = await importUseActivity()
    const { fetchAnalytics } = useActivity()
    await fetchAnalytics()
    expect(mockFetchAnalytics).toHaveBeenCalledWith('month')
  })

  it('fetchAnalytics sets error on failure', async () => {
    mockFetchAnalytics.mockRejectedValue(new Error('fail'))
    const useActivity = await importUseActivity()
    const { error, fetchAnalytics } = useActivity()
    await fetchAnalytics()
    expect(error.value).toBe("Impossible de charger les données d'activité. Veuillez réessayer.")
  })

  it('fetchAnalytics sets isLoading true during fetch then false', async () => {
    let resolve: (v: unknown) => void
    mockFetchAnalytics.mockReturnValue(new Promise((r) => (resolve = r)))
    const useActivity = await importUseActivity()
    const { isLoading, fetchAnalytics } = useActivity()
    const promise = fetchAnalytics()
    expect(isLoading.value).toBe(true)
    resolve!(fakeAnalytics)
    await promise
    expect(isLoading.value).toBe(false)
  })

  it('setPeriod updates period and calls fetchAnalytics', async () => {
    mockFetchAnalytics.mockResolvedValue(fakeAnalytics)
    const useActivity = await importUseActivity()
    const { period, setPeriod } = useActivity()
    await setPeriod('quarter')
    expect(period.value).toBe('quarter')
    expect(mockFetchAnalytics).toHaveBeenCalledWith('quarter')
  })

  it('exportFiscal sets isExporting true during export then false', async () => {
    const fakeBlob = new Blob(['data'])
    let resolve: (v: unknown) => void
    mockDownloadFiscalExport.mockReturnValue(new Promise((r) => (resolve = r)))
    const useActivity = await importUseActivity()
    const { isExporting, exportFiscal } = useActivity()
    const promise = exportFiscal('pdf', 'summary')
    expect(isExporting.value).toBe(true)
    resolve!(fakeBlob)
    await promise
    expect(isExporting.value).toBe(false)
  })

  it('exportFiscal calls downloadFiscalExport with current year', async () => {
    const fakeBlob = new Blob(['data'])
    mockDownloadFiscalExport.mockResolvedValue(fakeBlob)
    const useActivity = await importUseActivity()
    const { exportFiscal } = useActivity()
    await exportFiscal('pdf', 'summary')
    const currentYear = new Date().getFullYear()
    expect(mockDownloadFiscalExport).toHaveBeenCalledWith(currentYear, 'pdf', 'summary')
  })

  it('exportFiscal sets error on failure', async () => {
    mockDownloadFiscalExport.mockRejectedValue(new Error('Export failed'))
    const useActivity = await importUseActivity()
    const { error, exportFiscal } = useActivity()
    await exportFiscal('csv', 'transactions')
    expect(error.value).toBe("Impossible de générer l'export. Veuillez réessayer.")
  })

  it('exportFiscal resets isExporting to false on failure', async () => {
    mockDownloadFiscalExport.mockRejectedValue(new Error('fail'))
    const useActivity = await importUseActivity()
    const { isExporting, exportFiscal } = useActivity()
    await exportFiscal('pdf', 'dac7')
    expect(isExporting.value).toBe(false)
  })
})
