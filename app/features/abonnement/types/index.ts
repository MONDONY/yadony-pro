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
  /**
   * Vrai si une session Checkout ouverte maintenant porterait un essai gratuit.
   *
   * Calculé par le backend (`ProTrialPolicy`) et jamais rejoué ici : la règle croise le
   * nombre de trajets réalisés et le passé de client Stripe, deux informations que le
   * client n'a pas. Une condition dupliquée finirait par annoncer un essai que Stripe
   * refuserait.
   *
   * Optionnel : un backend antérieur à cette exposition n'émet pas le champ, et la page
   * doit alors se comporter comme si l'essai n'existait pas plutôt que d'afficher
   * « undefined jours ».
   */
  trialEligible?: boolean
  /** Durée de cet essai en jours, absente quand `trialEligible` est faux. */
  trialDays?: number | null
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
