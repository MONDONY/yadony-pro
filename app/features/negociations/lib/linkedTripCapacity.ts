import type { LinkedTripSummary } from '@/features/negociations/types'

/** Capacité restante d'un trajet lié : kilos, ou m³ pour un trajet bateau ; null si rien n'est servi. */
export function linkedTripCapacityLabel(trip: Pick<LinkedTripSummary, 'availableKg' | 'availableVolumeM3'>): string | null {
  if (trip.availableKg != null) return `${trip.availableKg} kg`
  if (trip.availableVolumeM3 != null) return `${String(trip.availableVolumeM3).replace('.', ',')} m³`
  return null
}
