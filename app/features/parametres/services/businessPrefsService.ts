import { useApi } from '@/composables/useApi'
import type { BusinessPreferences } from '@/features/parametres/types/index'

export function businessPrefsService() {
  const api = useApi()

  async function fetchPreferences(): Promise<BusinessPreferences> {
    return api<BusinessPreferences>('/users/me/business-preferences')
  }

  async function savePreferences(prefs: BusinessPreferences): Promise<BusinessPreferences> {
    return api<BusinessPreferences>('/users/me/business-preferences', {
      method: 'PUT',
      body: prefs,
    })
  }

  return { fetchPreferences, savePreferences }
}
