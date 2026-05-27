import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

async function importService() {
  const mod = await import('@/features/tarifs/services/priceGridService')
  return mod.priceGridService
}

const item = { id: 'i1', label: 'Paris → Dakar', unitPriceNet: 12, unitPriceDisplay: 13.5, position: 0 }

describe('priceGridService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('list calls GET /travelers/me/price-grid', async () => {
    mockApiFn.mockResolvedValue([item])
    const svc = (await importService())()
    const result = await svc.list()
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/price-grid')
    expect(result).toEqual([item])
  })

  it('addItem POSTs to /items with the input body', async () => {
    mockApiFn.mockResolvedValue(item)
    const svc = (await importService())()
    await svc.addItem({ label: 'Paris → Dakar', unitPriceNet: 12 })
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/price-grid/items', {
      method: 'POST',
      body: { label: 'Paris → Dakar', unitPriceNet: 12 },
    })
  })

  it('updateItem PUTs to /items/{id}', async () => {
    mockApiFn.mockResolvedValue(item)
    const svc = (await importService())()
    await svc.updateItem('i1', { label: 'x', unitPriceNet: 9 })
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/price-grid/items/i1', {
      method: 'PUT',
      body: { label: 'x', unitPriceNet: 9 },
    })
  })

  it('deleteItem DELETEs /items/{id}', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const svc = (await importService())()
    await svc.deleteItem('i1')
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/price-grid/items/i1', { method: 'DELETE' })
  })

  it('reorder PUTs /reorder with orderedIds', async () => {
    mockApiFn.mockResolvedValue([item])
    const svc = (await importService())()
    await svc.reorder(['i2', 'i1'])
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/price-grid/reorder', {
      method: 'PUT',
      body: { orderedIds: ['i2', 'i1'] },
    })
  })
})
