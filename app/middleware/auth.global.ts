import { useAuthStore } from '@/stores/auth'

// '/design' : page interne de référence du design system (aucune donnée).
const PUBLIC_ROUTES = ['/login', '/upgrade', '/', '/design']

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (PUBLIC_ROUTES.includes(to.path)) {
    return
  }
  const auth = useAuthStore()
  if (!auth.isAuthenticated) {
    return navigateTo('/login')
  }
})
