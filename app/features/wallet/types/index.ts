// app/features/wallet/types/index.ts

export type TopupMethod = 'STRIPE' | 'WAVE' | 'ORANGE_MONEY'

export interface WalletTransaction {
  type: string
  amount: number
  balanceAfter: number
  paymentRef: string | null
  createdAt: string
  /** Devise de la ligne : la liste mêle les portefeuilles d'un même voyageur ; absente sur un serveur antérieur. */
  currency?: string
  /** Remboursement en cours ou terminé de cette recharge ; null sinon. */
  refundStatus?: string | null
}

/** Solde d'un des portefeuilles du voyageur (un par devise). */
export interface WalletCurrencyBalance {
  currency: string
  balance: number
  /** Portefeuille de la devise active, celui que la recharge crédite. */
  active: boolean
  refundEligible: boolean
  refundableAmount: number
  nonRefundableAmount: number
  refundFeeAmount: number
  refundNetAmount: number
  /** Équivalent estimé dans la devise active. */
  estimatedInActive: number | null
}

export interface WalletBalance {
  balance: number
  currency: string
  transactions: WalletTransaction[]
  /** Un portefeuille par devise ; absent sur un serveur antérieur. */
  balances?: WalletCurrencyBalance[]
  refundEligible?: boolean
  /** Total multidevise estimé dans la devise active. */
  estimatedTotal?: number | null
  /** Faux quand une devise n'a pas pu être convertie : le total est alors partiel. */
  estimateComplete?: boolean
}

export interface WalletTopupResult {
  clientSecret: string | null
  redirectUrl: string | null
}

/** Session Stripe Checkout hébergée : le portail y redirige pour une recharge par carte. */
export interface WalletCardTopupSession {
  url: string
}

export type CardTopupOutcome =
  | { status: 'redirect'; url: string }
  /** Le serveur ne connaît pas encore la recharge web (déploiement en retard). */
  | { status: 'unavailable' }
  | { status: 'error'; message: string }

export interface MobileMoneyProviderOption {
  code: string
  label: string
  detected: boolean
}

export interface MobileMoneyProviders {
  country: string
  /** Devise de l'opérateur du numéro : c'est celle que la recharge crédite. */
  currency: string
  msisdnMasked: string
  detected: string | null
  providers: MobileMoneyProviderOption[]
}

export interface MobileMoneyTopupRequest {
  amount: number
  phoneNumber: string
  provider: string
}

export interface MobileMoneyTopupStarted {
  topupId: string
  currency: string
  provider: string
  providerLabel: string
  msisdnMasked: string
  /** Wave : page à ouvrir pour valider le paiement. */
  authorizationUrl: string | null
}

export type MobileMoneyTopupStatus = 'PENDING' | 'CONFIRMED' | 'FAILED'

export interface MobileMoneyTopupState {
  topupId: string
  status: MobileMoneyTopupStatus
  amount: number
  currency: string
  providerLabel: string
  authorizationUrl: string | null
  failureReason: string | null
  walletBalance: number | null
}

export interface EligibleTopup {
  id: string
  /** Part encore remboursable de la recharge. */
  amount: number
  originalAmount: number
  paymentRef: string | null
  createdAt: string
  feeAmount: number | null
}

export interface RefundRequestSummary {
  id: string
  currency: string
  amount: number
  status: string
  requestedAt: string
  resolvedAt: string | null
  feeAmount: number | null
  netAmount: number | null
  /** STRIPE, PAWAPAY ou MANUAL. */
  rail: string
  destinationMasked: string | null
}
