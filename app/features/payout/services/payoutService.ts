import { useApi } from '@/composables/useApi'
import type {
  ConnectAccount, MobileMoneyAccount, MobileMoneyProviderCatalogue, OnboardingLink,
} from '@/features/payout/types/index'

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

  // ── Versement mobile money ────────────────────────────────────────────────

  async function fetchMobileMoneyAccount(): Promise<MobileMoneyAccount> {
    return api<MobileMoneyAccount>('/payments/mobile-money/account')
  }

  /** POST : le numéro voyage dans le corps, jamais dans l'URL. */
  async function lookupMobileMoneyProviders(phoneNumber: string): Promise<MobileMoneyProviderCatalogue> {
    return api<MobileMoneyProviderCatalogue>('/payments/mobile-money/providers', {
      method: 'POST',
      body: { phoneNumber },
    })
  }

  async function activateMobileMoney(phoneNumber: string, providers: string[]): Promise<MobileMoneyAccount> {
    return api<MobileMoneyAccount>('/payments/mobile-money/account', {
      method: 'POST',
      body: { phoneNumber, providers },
    })
  }

  async function updateMobileMoneyProviders(providers: string[]): Promise<MobileMoneyAccount> {
    return api<MobileMoneyAccount>('/payments/mobile-money/account/providers', {
      method: 'PUT',
      body: { providers },
    })
  }

  async function disableMobileMoney(): Promise<MobileMoneyAccount> {
    return api<MobileMoneyAccount>('/payments/mobile-money/account', { method: 'DELETE' })
  }

  return {
    fetchAccount, createAccount, createOnboardingLink, refreshAccount,
    fetchMobileMoneyAccount, lookupMobileMoneyProviders, activateMobileMoney,
    updateMobileMoneyProviders, disableMobileMoney,
  }
}
