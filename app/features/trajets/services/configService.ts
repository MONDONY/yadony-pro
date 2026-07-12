import { useApi } from '@/composables/useApi'

export interface ContentCategory {
  code: string
  label: string
  emoji: string
}

export function configService() {
  const api = useApi()

  async function fetchContentCategories(): Promise<ContentCategory[]> {
    // Tolère les deux contrats : le backend d'avant l'unification du
    // vocabulaire renvoie encore string[] — pendant la fenêtre de
    // déploiement (ou en local sur une instance non redémarrée), on
    // normalise vers {code,label,emoji} plutôt que d'afficher des chips
    // vides (label undefined).
    const raw = await api<Array<string | ContentCategory>>('/config/content-categories')
    return raw.map((c) => (typeof c === 'string' ? { code: c, label: c, emoji: '' } : c))
  }

  return { fetchContentCategories }
}
