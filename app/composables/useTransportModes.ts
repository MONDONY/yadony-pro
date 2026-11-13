// app/composables/useTransportModes.ts
import { useApi } from '@/composables/useApi'
import type { TransportModesFlags } from '@/lib/transportModes'

const NONE: TransportModesFlags = { road: false, boat: false }

// Cache module-level : une seule requête pour la session, partagée entre les features.
let cached: TransportModesFlags | null = null
let pending: Promise<TransportModesFlags> | null = null

function parse(res: unknown): TransportModesFlags | null {
  if (!res || typeof res !== 'object') return null
  const { road, boat } = res as Record<string, unknown>
  if (typeof road !== 'boolean' || typeof boat !== 'boolean') return null
  return { road, boat }
}

export function useTransportModes() {
  const api = useApi()

  /**
   * Interrupteurs route et bateau servis par `GET /config/transport-modes`.
   * 404, erreur ou réponse invalide : avion seul, sans mise en cache (retente au prochain appel).
   */
  async function getFlags(): Promise<TransportModesFlags> {
    if (cached) return cached
    if (pending) return pending
    pending = api<unknown>('/config/transport-modes')
      .then((res) => {
        const flags = parse(res)
        if (!flags) return { ...NONE }
        cached = flags
        return flags
      })
      .catch(() => ({ ...NONE }))
      .finally(() => {
        pending = null
      })
    return pending
  }

  return { getFlags }
}

/** Réservé aux tests. */
export function resetTransportModesCache(): void {
  cached = null
  pending = null
}
