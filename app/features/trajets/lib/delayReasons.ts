import type { TransportMode, TripDelayReason } from '@/features/trajets/types/index'

const ALL: Array<{ value: TripDelayReason; label: string }> = [
  { value: 'PORT_CONGESTION', label: 'Congestion au port' },
  { value: 'WEATHER', label: 'Météo' },
  { value: 'EXTENDED_STOPOVER', label: 'Escale prolongée' },
  { value: 'TRANSPORT_DISRUPTION', label: 'Trafic perturbé' },
  { value: 'OTHER', label: 'Autre raison' },
]

/** Libellé d'un motif de retard ; repli neutre pour un motif inconnu. */
export function delayReasonLabel(reason: string | null | undefined): string {
  return ALL.find((r) => r.value === reason)?.label ?? 'Retard'
}

/**
 * Motifs de retard proposés selon le mode du trajet. « Congestion au port » est propre au bateau
 * (le back refuse ce motif ailleurs, 422 trip-delay-reason-invalid).
 */
export function delayReasons(mode: TransportMode | null | undefined): Array<{ value: TripDelayReason; label: string }> {
  return mode === 'BOAT' ? [...ALL] : ALL.filter((r) => r.value !== 'PORT_CONGESTION')
}
