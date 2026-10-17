// app/features/profil-public/types/index.ts

export interface PublicProfile {
  userId: string
  displayName: string
  avatarUrl: string | null
  kycVerified: boolean
  isProAccount: boolean
  /** Badge GP Pro (voyageur régulier reconnu par l'équipe Yadony). Absent sur un back antérieur : vaut false. */
  gpPro?: boolean
  completedBidsCount: number
  averageRating: number
  ratingCount: number
  memberSince: string
  badges: string[]
  contactMode: string | null
  responseDelayHours: number | null
}
