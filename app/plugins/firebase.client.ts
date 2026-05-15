import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const pub = config.public as Record<string, string>
  const firebaseConfig = {
    apiKey: pub.firebaseApiKey || '',
    authDomain: pub.firebaseAuthDomain || '',
    projectId: pub.firebaseProjectId || '',
    appId: pub.firebaseAppId || '',
  }

  let app: FirebaseApp
  let auth: Auth

  try {
    app = getApps().length
      ? getApps()[0]!
      : initializeApp(firebaseConfig)
    auth = getAuth(app)
  } catch (e) {
    // Firebase initialization failure (e.g., invalid key in test environments)
    // is non-fatal — auth operations will fail gracefully when called.
    console.warn('[firebase.client] init error:', e)
    // Provide stub objects so consumers don't crash on access
    return {
      provide: {
        firebaseApp: null as unknown as FirebaseApp,
        firebaseAuth: null as unknown as Auth,
      },
    }
  }

  return {
    provide: {
      firebaseApp: app,
      firebaseAuth: auth,
    },
  }
})
