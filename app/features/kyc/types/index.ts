// app/features/kyc/types/index.ts

export interface KycStatusInfo {
  kycStatus: string
  verificationStatus: string
}

export interface KycSession {
  stripeUrl: string
  sessionId: string
  status: string
}

export type KycTone = 'success' | 'warning' | 'error' | 'neutral'

export interface KycDescriptor {
  tone: KycTone
  label: string
  /** true when the traveler should (re)start the identity verification */
  canVerify: boolean
}

/**
 * Maps a raw backend kycStatus to a display descriptor.
 * Unknown / empty statuses are treated as "not verified" (action required).
 */
export function describeKycStatus(kycStatus: string | null | undefined): KycDescriptor {
  switch ((kycStatus ?? '').toUpperCase()) {
    case 'VERIFIED':
      return { tone: 'success', label: 'Identité vérifiée', canVerify: false }
    case 'PENDING':
    case 'PROCESSING':
      return { tone: 'warning', label: 'Vérification en cours', canVerify: false }
    case 'REQUIRES_INPUT':
    case 'FAILED':
    case 'REJECTED':
    case 'CANCELED':
      return { tone: 'error', label: 'Vérification à reprendre', canVerify: true }
    default:
      return { tone: 'neutral', label: 'Identité non vérifiée', canVerify: true }
  }
}
