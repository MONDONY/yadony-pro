import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: (config.public as Record<string, string>).firebaseApiKey
      || config.public.firebase?.apiKey as string || '',
    authDomain: (config.public as Record<string, string>).firebaseAuthDomain
      || config.public.firebase?.authDomain as string || '',
    projectId: (config.public as Record<string, string>).firebaseProjectId
      || config.public.firebase?.projectId as string || '',
    appId: (config.public as Record<string, string>).firebaseAppId
      || config.public.firebase?.appId as string || '',
  }

  const app: FirebaseApp = getApps().length
    ? getApps()[0]!
    : initializeApp(firebaseConfig)

  const auth: Auth = getAuth(app)

  return {
    provide: {
      firebaseApp: app,
      firebaseAuth: auth,
    },
  }
})
