import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, type Auth } from 'firebase/auth'
import { useAuthStore, type AuthUser } from '@/stores/auth'

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  const pub = config.public as Record<string, string>

  const firebaseConfig = {
    apiKey: pub.firebaseApiKey,
    authDomain: pub.firebaseAuthDomain,
    projectId: pub.firebaseProjectId,
    appId: pub.firebaseAppId,
  }

  const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
  const auth: Auth = getAuth(app)
  const authStore = useAuthStore()

  // Await Firebase's initial auth-state check — it reads its IndexedDB storage
  // and calls back with the restored user (or null). Nuxt blocks route middleware
  // until all async plugins resolve, so auth.global.ts always sees the right state.
  await new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe()

      if (firebaseUser && !authStore.isAuthenticated) {
        try {
          const idToken = await firebaseUser.getIdToken()
          const user = await $fetch<AuthUser>(`${pub.apiBaseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }).catch(() => null)

          if (user) {
            authStore.setSession(idToken, user)
          } else {
            // Backend rejected the token (account deleted, etc.) — clean up
            await auth.signOut()
          }
        } catch {
          authStore.clear()
        }
      }

      resolve()
    })
  })

  // Ongoing listener: keep the token fresh when Firebase rotates it,
  // and clear the store if the user signs out from another tab
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const freshToken = await firebaseUser.getIdToken()
      if (authStore.idToken && freshToken !== authStore.idToken) {
        authStore.idToken = freshToken
      }
    } else if (authStore.isAuthenticated) {
      authStore.clear()
      navigateTo('/login')
    }
  })

  return { provide: { firebaseApp: app, firebaseAuth: auth } }
})
