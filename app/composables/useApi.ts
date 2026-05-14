import { useAuthStore } from '@/stores/auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let apiInstance: any = null

export function useApi(): ReturnType<typeof $fetch.create> {
  if (apiInstance) return apiInstance

  const config = useRuntimeConfig()
  const auth = useAuthStore()

  apiInstance = $fetch.create({
    baseURL: config.public.apiBaseUrl as string,
    onRequest({ options }) {
      const token = auth.idToken
      if (token) {
        const existing = (options.headers as Record<string, string>) ?? {}
        options.headers = {
          ...existing,
          Authorization: `Bearer ${token}`,
        }
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        auth.clear()
        navigateTo('/login')
      }
    },
  })

  return apiInstance
}

export function _resetApiInstance(): void {
  apiInstance = null
}
