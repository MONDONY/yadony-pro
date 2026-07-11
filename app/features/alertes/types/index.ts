// app/features/alertes/types/index.ts

export type AlertDirection = 'TRAVELER_WANTS_PACKAGES' | 'SENDER_WANTS_TRIPS'

export interface CorridorAlert {
  id: string
  departureCity: string
  arrivalCity: string
  dateFrom: string | null
  dateTo: string | null
  minWeightKg: number | null
  direction: AlertDirection
  active: boolean
  matchCount: number
  createdAt: string
}

export interface CreateCorridorAlertPayload {
  departureCity: string
  arrivalCity: string
  dateFrom: string | null
  dateTo: string | null
  minWeightKg: number | null
}
