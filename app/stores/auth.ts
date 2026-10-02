import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'

export interface AuthUser {
  id: string
  phoneNumber: string | null
  email?: string | null
  displayName: string
  isProAccount: boolean
  roles: string[]
  avatarUrl: string | null
  /** Langue des notifications, e-mails et messages du serveur ; absente d'un serveur antérieur. */
  preferredLanguage?: 'fr' | 'en' | null
}

interface AuthState {
  idToken: string | null
  user: AuthUser | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    idToken: null,
    user: null,
  }),
  getters: {
    isAuthenticated: (state): boolean =>
      state.idToken !== null && state.user !== null,
    isProAccount: (state): boolean =>
      state.user?.isProAccount ?? false,
  },
  actions: {
    setSession(token: string, user: AuthUser) {
      this.idToken = token
      this.user = user
    },
    clear() {
      this.idToken = null
      this.user = null
    },
    async refreshUser() {
      if (!this.idToken) return
      try {
        const api = useApi()
        const user = await api<AuthUser>('/auth/me')
        this.user = user
      } catch {
        // Un échec de rafraîchissement ne doit jamais vider la session existante :
        // perdre la session parce que /auth/me a échoué serait pire que ne pas rafraîchir.
      }
    },
  },
})
