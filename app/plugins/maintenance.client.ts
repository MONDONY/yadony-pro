import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMaintenanceStore } from '@/stores/maintenance'

/** Pendant la maintenance : relecture rapprochée pour refermer la page dès la réouverture. */
export const ACTIVE_POLL_MS = 30_000
/** Sinon : relecture espacée, pour qu'un onglet resté ouvert bascule sans clic. */
export const IDLE_POLL_MS = 60_000

/**
 * Lit l'état du mode maintenance au chargement, au retour sur l'onglet, puis
 * périodiquement (plus souvent tant que la page de maintenance est affichée).
 */
export default defineNuxtPlugin(() => {
  const store = useMaintenanceStore()
  let timer: ReturnType<typeof setTimeout> | null = null

  function schedule() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(async () => {
      if (document.visibilityState === 'visible') await store.check()
      schedule()
    }, store.active ? ACTIVE_POLL_MS : IDLE_POLL_MS)
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void store.check()
  })
  store.$subscribe(() => schedule())
  // Session restaurée ou changée : un compte exempté doit être reconnu tout de suite.
  watch(() => useAuthStore().idToken, () => { void store.check() })

  void store.check()
  schedule()
})
