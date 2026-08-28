// app/features/abonnement/types/index.ts

export type BillingCycle = 'MONTHLY' | 'YEARLY'

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'LEGACY_GRACE'
  | 'CANCELED'
  | 'EXPIRED'
  | 'NONE'

export type SubscriptionSource = 'STRIPE' | 'ADMIN_GRANT' | 'LEGACY_FREE'

export interface ProSubscription {
  active: boolean
  status: SubscriptionStatus
  source: SubscriptionSource | null
  billingCycle: BillingCycle | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  graceExpiresAt: string | null
}

export interface BillingSessionUrl {
  url: string
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Actif',
  PAST_DUE: 'Paiement en retard',
  LEGACY_GRACE: 'Période de grâce',
  CANCELED: 'Résilié',
  EXPIRED: 'Expiré',
  NONE: 'Aucun abonnement',
}

export interface SubscriptionPricingPlan {
  amount: number
  currency: 'EUR'
  label: string
}

export const SUBSCRIPTION_PRICING: Record<BillingCycle, SubscriptionPricingPlan> = {
  MONTHLY: {
    amount: 4.99,
    currency: 'EUR',
    label: '4,99 € / mois',
  },
  YEARLY: {
    amount: 47.9,
    currency: 'EUR',
    label: '47,90 € / an',
  },
}

// Le cycle facturé peut différer du tarif catalogue courant (abonné historique
// ou promotionnel) : ce libellé décrit UNIQUEMENT la périodicité, jamais un prix.
export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  MONTHLY: 'Mensuel',
  YEARLY: 'Annuel',
}
