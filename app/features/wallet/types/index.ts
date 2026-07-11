// app/features/wallet/types/index.ts

export type TopupMethod = 'STRIPE' | 'WAVE' | 'ORANGE_MONEY'

export interface WalletTransaction {
  type: string
  amount: number
  balanceAfter: number
  paymentRef: string | null
  createdAt: string
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
