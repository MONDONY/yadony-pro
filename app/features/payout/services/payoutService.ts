import { useApi } from '@/composables/useApi'
import type { ConnectAccount, OnboardingLink } from '@/features/payout/types/index'

export function payoutService() {
  const api = useApi()

  async function fetchAccount(): Promise<ConnectAccount> {
    return api<ConnectAccount>('/payments/connect/account')
  }

  async function createAccount(): Promise<ConnectAccount> {
    return api<ConnectAccount>('/payments/connect/account', { method: 'POST' })
  }

  async function createOnboardingLink(): Promise<OnboardingLink> {
    return api<OnboardingLink>('/payments/connect/onboarding-link', { method: 'POST' })
  }

  async function refreshAccount(): Promise<ConnectAccount> {
    return api<ConnectAccount>('/payments/connect/refresh', { method: 'POST' })
  }

  return { fetchAccount, createAccount, createOnboardingLink, refreshAccount }
}
