import { useAuthStore } from '@/stores/auth'

const PUBLIC_ROUTES = ['/login', '/upgrade']

export default defineNuxtRouteMiddleware((to) => {
  if (PUBLIC_ROUTES.includes(to.path)) {
    return
  }
  const auth = useAuthStore()
  if (!auth.isAuthenticated) {
    return navigateTo('/login')
  }
})
