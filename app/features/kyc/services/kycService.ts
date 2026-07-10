import { useApi } from '@/composables/useApi'
import type { KycStatusInfo, KycSession } from '@/features/kyc/types/index'

export function kycService() {
  const api = useApi()

  async function fetchStatus(): Promise<KycStatusInfo> {
    return api<KycStatusInfo>('/kyc/status')
  }

  async function startVerification(): Promise<KycSession> {
    return api<KycSession>('/kyc/session', { method: 'POST' })
  }

  return { fetchStatus, startVerification }
}
