import { isRoad } from '@/lib/transportModes'
import type { RescheduleReason, TransportMode } from '@/features/trajets/types/index'

/**
 * Motifs de report proposés selon le mode du trajet. Le premier motif suit le mode :
 * avion « Vol annulé » (FLIGHT_CANCELLED, toujours accepté), route « Panne ou contretemps »,
 * autres modes « Transport annulé » (TRANSPORT_CANCELLED).
 */
export function rescheduleReasons(mode: TransportMode | null | undefined): Array<{ value: RescheduleReason; label: string }> {
  let first: { value: RescheduleReason; label: string }
  if (mode === 'PLANE') first = { value: 'FLIGHT_CANCELLED', label: 'Vol annulé' }
  else if (isRoad(mode)) first = { value: 'TRANSPORT_CANCELLED', label: 'Panne ou contretemps' }
  else first = { value: 'TRANSPORT_CANCELLED', label: 'Transport annulé' }
  return [
    first,
    { value: 'POSTPONED', label: 'Voyage repoussé' },
    { value: 'OTHER', label: 'Autre raison' },
  ]
}
