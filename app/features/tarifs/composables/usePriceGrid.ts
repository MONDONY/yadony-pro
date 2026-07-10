import { ref } from 'vue'
import { priceGridService } from '@/features/tarifs/services/priceGridService'
import type { MoveDirection, PriceGridItem, PriceGridItemInput } from '@/features/tarifs/types/index'

export function usePriceGrid() {
  const items = ref<PriceGridItem[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const svc = priceGridService()

  async function fetchItems(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      items.value = await svc.list()
    } catch {
      error.value = 'Impossible de charger ta grille tarifaire.'
    } finally {
      isLoading.value = false
    }
  }

  async function addItem(input: PriceGridItemInput): Promise<boolean> {
    isSaving.value = true
    error.value = null
    try {
      const created = await svc.addItem(input)
      items.value = [...items.value, created]
      return true
    } catch {
      error.value = "Impossible d'ajouter cette ligne. Veuillez réessayer."
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function updateItem(id: string, input: PriceGridItemInput): Promise<boolean> {
    isSaving.value = true
    error.value = null
    try {
      const updated = await svc.updateItem(id, input)
      items.value = items.value.map((it) => (it.id === id ? updated : it))
      return true
    } catch {
      error.value = 'Impossible de modifier cette ligne. Veuillez réessayer.'
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function removeItem(id: string): Promise<boolean> {
    isSaving.value = true
    error.value = null
    try {
      await svc.deleteItem(id)
      items.value = items.value.filter((it) => it.id !== id)
      return true
    } catch {
      error.value = 'Impossible de supprimer cette ligne. Veuillez réessayer.'
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function move(id: string, direction: MoveDirection): Promise<void> {
    const ids = items.value.map((it) => it.id)
    const idx = ids.indexOf(id)
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (idx === -1 || target < 0 || target >= ids.length) return
    ;[ids[idx], ids[target]] = [ids[target], ids[idx]]
    isSaving.value = true
    error.value = null
    try {
      items.value = await svc.reorder(ids)
    } catch {
      error.value = 'Impossible de réordonner la grille. Veuillez réessayer.'
    } finally {
      isSaving.value = false
    }
  }

  return { items, isLoading, isSaving, error, fetchItems, addItem, updateItem, removeItem, move }
}
