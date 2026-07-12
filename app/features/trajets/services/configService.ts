import { useApi } from '@/composables/useApi'

export interface ContentCategory {
  code: string
  label: string
  emoji: string
}

export function configService() {
  const api = useApi()

  async function fetchContentCategories(): Promise<ContentCategory[]> {
    return api<ContentCategory[]>('/config/content-categories')
  }

  return { fetchContentCategories }
}
