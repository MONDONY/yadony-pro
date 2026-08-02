import { useAuthStore, type AuthUser } from '@/stores/auth'

export default defineNuxtPlugin(() => {
  if (!import.meta.dev) return
  const auth = useAuthStore()
  const w = window as unknown as {
    __yadonyAuth: ReturnType<typeof useAuthStore>
    __yadonyAuthSeed?: AuthUser
  }
  w.__yadonyAuth = auth
  // Re-hydrate the store on every page load from a seed injected via addInitScript.
  // Used by E2E tests to keep the session alive across full navigations.
  if (w.__yadonyAuthSeed) {
    auth.setSession('fake-token', w.__yadonyAuthSeed)
  }
})
