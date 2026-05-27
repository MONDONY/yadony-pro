// app/features/parametres/types/index.ts

export type WeightUnit = 'kg' | 'lbs'
export type CurrencyCode = 'EUR' | 'XOF' | 'XAF'
export type ContactMode = 'call' | 'message' | 'both'

export interface BusinessPreferences {
  weightUnit: WeightUnit
  currencyCode: CurrencyCode
  pickupRadiusKm: number
  defaultPackageWeightKg: number
  minBidPriceEur: number
  contactMode: ContactMode | null
  responseDelayHours: number | null
}

export const DEFAULT_BUSINESS_PREFERENCES: BusinessPreferences = {
  weightUnit: 'kg',
  currencyCode: 'EUR',
  pickupRadiusKm: 10,
  defaultPackageWeightKg: 23,
  minBidPriceEur: 0,
  contactMode: null,
  responseDelayHours: null,
}

export const WEIGHT_UNIT_OPTIONS: { value: WeightUnit; label: string }[] = [
  { value: 'kg', label: 'Kilogrammes (kg)' },
  { value: 'lbs', label: 'Livres (lbs)' },
]

export const CURRENCY_OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'XOF', label: 'Franc CFA Ouest (XOF)' },
  { value: 'XAF', label: 'Franc CFA Central (XAF)' },
]

export const CONTACT_MODE_OPTIONS: { value: ContactMode; label: string }[] = [
  { value: 'call', label: 'Appel' },
  { value: 'message', label: 'Message' },
  { value: 'both', label: 'Appel ou message' },
]
