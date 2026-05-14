import { useAuthStore } from '@/stores/auth'

export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore()
  if (!auth.isProAccount) {
    return navigateTo('/upgrade')
  }
})
