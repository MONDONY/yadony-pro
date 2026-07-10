// app/features/profil-public/types/index.ts

export interface PublicProfile {
  userId: string
  displayName: string
  avatarUrl: string | null
  kycVerified: boolean
  isProAccount: boolean
  isKiloPro: boolean
  completedBidsCount: number
  averageRating: number
  ratingCount: number
  memberSince: string
  badges: string[]
  contactMode: string | null
  responseDelayHours: number | null
}
