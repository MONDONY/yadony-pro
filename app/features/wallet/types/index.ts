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
}

export interface WalletBalance {
  balance: number
  currency: string
  transactions: WalletTransaction[]
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
