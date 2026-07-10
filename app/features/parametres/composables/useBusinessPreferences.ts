import { ref } from 'vue'
import { businessPrefsService } from '@/features/parametres/services/businessPrefsService'
import { DEFAULT_BUSINESS_PREFERENCES, type BusinessPreferences } from '@/features/parametres/types/index'

export function useBusinessPreferences() {
  const preferences = ref<BusinessPreferences>({ ...DEFAULT_BUSINESS_PREFERENCES })
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const savedAt = ref<number | null>(null)

  const svc = businessPrefsService()

  async function fetchPreferences(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      preferences.value = await svc.fetchPreferences()
    } catch {
      error.value = 'Impossible de charger tes préférences. Veuillez réessayer.'
    } finally {
      isLoading.value = false
    }
  }

  async function savePreferences(next: BusinessPreferences): Promise<boolean> {
    isSaving.value = true
    error.value = null
    try {
      preferences.value = await svc.savePreferences(next)
      savedAt.value = Date.now()
      return true
    } catch {
      error.value = "Impossible d'enregistrer tes préférences. Veuillez réessayer."
      return false
    } finally {
      isSaving.value = false
    }
  }

  return { preferences, isLoading, isSaving, error, savedAt, fetchPreferences, savePreferences }
}
