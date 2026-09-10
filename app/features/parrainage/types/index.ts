// app/features/parrainage/types/index.ts

// Miroir de MyReferralResponse côté backend : la récompense est un bon de
// réduction de commission, plus un montant. L'ancien `totalEarnedCents` n'est
// plus servi et affichait « NaN € ».
export interface ReferralInfo {
  code: string
  shareUrl: string
  totalInvited: number
  signedUp: number
  rewarded: number
  hasBeenReferred?: boolean
  /** Bons octroyés, ni consommés ni expirés. */
  activeVoucherCount?: number
  /** Facteur appliqué à la commission par un bon (0.5 = moitié prix). */
  voucherFactor?: number
  /** Expiration du bon actif le plus proche, null sans bon actif. */
  nextVoucherExpiresAt?: string | null
}
