import { useApi } from '@/composables/useApi'
import type { ReferralInfo } from '@/features/parrainage/types/index'

export function referralService() {
  const api = useApi()

  async function fetchReferral(): Promise<ReferralInfo> {
    return api<ReferralInfo>('/me/referral')
  }

  async function regenerate(): Promise<ReferralInfo> {
    return api<ReferralInfo>('/me/referral/regenerate', { method: 'POST' })
  }

  return { fetchReferral, regenerate }
}
