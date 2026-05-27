import { useApi } from '@/composables/useApi'
import type { PriceGridItem, PriceGridItemInput } from '@/features/tarifs/types/index'

const BASE = '/travelers/me/price-grid'

export function priceGridService() {
  const api = useApi()

  async function list(): Promise<PriceGridItem[]> {
    return api<PriceGridItem[]>(BASE)
  }

  async function addItem(input: PriceGridItemInput): Promise<PriceGridItem> {
    return api<PriceGridItem>(`${BASE}/items`, { method: 'POST', body: input })
  }

  async function updateItem(id: string, input: PriceGridItemInput): Promise<PriceGridItem> {
    return api<PriceGridItem>(`${BASE}/items/${id}`, { method: 'PUT', body: input })
  }

  async function deleteItem(id: string): Promise<void> {
    await api(`${BASE}/items/${id}`, { method: 'DELETE' })
  }

  async function reorder(orderedIds: string[]): Promise<PriceGridItem[]> {
    return api<PriceGridItem[]>(`${BASE}/reorder`, { method: 'PUT', body: { orderedIds } })
  }

  return { list, addItem, updateItem, deleteItem, reorder }
}
