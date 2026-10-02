import { useApi } from '@/composables/useApi'

export type AppLanguage = 'fr' | 'en'

export function languageService() {
  const api = useApi()

  async function updateLanguage(language: AppLanguage): Promise<{ language: AppLanguage }> {
    return api<{ language: AppLanguage }>('/users/me/preferences', {
      method: 'PATCH',
      body: { language },
    })
  }

  return { updateLanguage }
}
