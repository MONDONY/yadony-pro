// app/features/payout/types/index.ts

export type StripeAccountStatus =
  | 'NOT_CREATED'
  | 'PENDING_ONBOARDING'
  | 'ONBOARDING_COMPLETE'
  | 'REJECTED'
  | 'DISABLED'

export interface ConnectAccount {
  stripeAccountId: string | null
  stripeAccountStatus: StripeAccountStatus
}

export interface OnboardingLink {
  url: string
}

export type PayoutTone = 'success' | 'warning' | 'error' | 'neutral'
export type PayoutAction = 'setup' | 'continue' | 'none'

export interface PayoutDescriptor {
  tone: PayoutTone
  label: string
  description: string
  action: PayoutAction
  /** true when the user can re-pull the Stripe state after returning from onboarding */
  canRefresh: boolean
}

export function describePayoutStatus(status: StripeAccountStatus | null | undefined): PayoutDescriptor {
  switch (status) {
    case 'ONBOARDING_COMPLETE':
      return {
        tone: 'success',
        label: 'Paiements activés',
        description: 'Tu peux recevoir tes gains. Aucune action requise.',
        action: 'none',
        canRefresh: false,
      }
    case 'PENDING_ONBOARDING':
      return {
        tone: 'warning',
        label: 'Configuration à terminer',
        description: 'Ton compte Stripe existe mais l’onboarding n’est pas terminé.',
        action: 'continue',
        canRefresh: true,
      }
    case 'REJECTED':
      return {
        tone: 'error',
        label: 'Compte refusé',
        description: 'Stripe a refusé ton compte. Contacte le support dony.',
        action: 'none',
        canRefresh: false,
      }
    case 'DISABLED':
      return {
        tone: 'error',
        label: 'Compte désactivé',
        description: 'Ton compte de paiement est désactivé. Contacte le support dony.',
        action: 'none',
        canRefresh: false,
      }
    case 'NOT_CREATED':
    default:
      return {
        tone: 'neutral',
        label: 'Paiements non configurés',
        description: 'Configure ton compte Stripe pour encaisser tes gains en sécurité.',
        action: 'setup',
        canRefresh: false,
      }
  }
}
