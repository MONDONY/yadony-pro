import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockList = vi.fn()
const mockAdd = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockReorder = vi.fn()

vi.mock('@/features/tarifs/services/priceGridService', () => ({
  priceGridService: () => ({
    list: mockList,
    addItem: mockAdd,
    updateItem: mockUpdate,
    deleteItem: mockDelete,
    reorder: mockReorder,
  }),
}))

async function importComposable() {
  const mod = await import('@/features/tarifs/composables/usePriceGrid')
  return mod.usePriceGrid
}

const a = { id: 'a', label: 'A', unitPriceNet: 10, unitPriceDisplay: 11, position: 0 }
const b = { id: 'b', label: 'B', unitPriceNet: 20, unitPriceDisplay: 22, position: 1 }

describe('usePriceGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchItems loads the grid', async () => {
    mockList.mockResolvedValue([a, b])
    const { items, fetchItems } = (await importComposable())()
    await fetchItems()
    expect(items.value).toEqual([a, b])
  })

  it('sets an error when fetchItems rejects', async () => {
    mockList.mockRejectedValue(new Error('x'))
    const { error, fetchItems } = (await importComposable())()
    await fetchItems()
    expect(error.value).toBe('Impossible de charger ta grille tarifaire.')
  })

  it('addItem appends the created item and returns true', async () => {
    mockAdd.mockResolvedValue(a)
    const { items, addItem } = (await importComposable())()
    const ok = await addItem({ label: 'A', unitPriceNet: 10 })
    expect(ok).toBe(true)
    expect(items.value).toEqual([a])
  })

  it('addItem returns false and sets an error on failure', async () => {
    mockAdd.mockRejectedValue(new Error('x'))
    const { addItem, error } = (await importComposable())()
    const ok = await addItem({ label: 'A', unitPriceNet: 10 })
    expect(ok).toBe(false)
    expect(error.value).toBe("Impossible d'ajouter cette ligne. Veuillez réessayer.")
  })

  it('updateItem replaces the matching item', async () => {
    mockList.mockResolvedValue([a, b])
    mockUpdate.mockResolvedValue({ ...a, label: 'A2' })
    const { items, fetchItems, updateItem } = (await importComposable())()
    await fetchItems()
    const ok = await updateItem('a', { label: 'A2', unitPriceNet: 10 })
    expect(ok).toBe(true)
    expect(items.value[0].label).toBe('A2')
  })

  it('removeItem filters out the deleted item', async () => {
    mockList.mockResolvedValue([a, b])
    mockDelete.mockResolvedValue(undefined)
    const { items, fetchItems, removeItem } = (await importComposable())()
    await fetchItems()
    const ok = await removeItem('a')
    expect(ok).toBe(true)
    expect(items.value).toEqual([b])
  })

  it('move down reorders with swapped ids', async () => {
    mockList.mockResolvedValue([a, b])
    mockReorder.mockResolvedValue([b, a])
    const { items, fetchItems, move } = (await importComposable())()
    await fetchItems()
    await move('a', 'down')
    expect(mockReorder).toHaveBeenCalledWith(['b', 'a'])
    expect(items.value).toEqual([b, a])
  })

  it('move does nothing at the boundary', async () => {
    mockList.mockResolvedValue([a, b])
    const { fetchItems, move } = (await importComposable())()
    await fetchItems()
    await move('a', 'up')
    expect(mockReorder).not.toHaveBeenCalled()
  })

  it('move sets an error when reorder rejects', async () => {
    mockList.mockResolvedValue([a, b])
    mockReorder.mockRejectedValue(new Error('x'))
    const { error, fetchItems, move } = (await importComposable())()
    await fetchItems()
    await move('a', 'down')
    expect(error.value).toBe('Impossible de réordonner la grille. Veuillez réessayer.')
  })
})
