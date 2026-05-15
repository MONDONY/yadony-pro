import { useApi } from '@/composables/useApi'

export function configService() {
  const api = useApi()

  async function fetchContentCategories(): Promise<string[]> {
    return api<string[]>('/config/content-categories')
  }

  return { fetchContentCategories }
}
