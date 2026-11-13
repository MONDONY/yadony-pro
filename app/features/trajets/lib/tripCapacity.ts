import { formatPerKg, formatPerM3 } from '@/lib/money'
import type { Trip } from '@/features/trajets/types/index'

type CapacityFields = Pick<
  Trip,
  'availableWeightKg' | 'usedWeightKg' | 'volumeCapacityM3' | 'availableVolumeM3' | 'pricePerKg' | 'pricePerM3' | 'currency'
>

/** Trajet au volume (bateau au m³) : pas de kilos, une capacité en m³. */
export function isVolumeTrip(trip: Pick<Trip, 'availableWeightKg' | 'volumeCapacityM3'>): boolean {
  return trip.availableWeightKg == null && trip.volumeCapacityM3 != null
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function formatM3(n: number): string {
  return String(round2(n)).replace('.', ',')
}

export interface CapacityView {
  /** Remplissage en pourcentage (0 sans capacité connue). */
  pct: number
  /** « 15 / 20 kg » ou « 4,5 / 12 m³ » ; vide sans capacité connue. */
  label: string
}

/** Capacité utilisée d'un trajet, en kilos ou en m³ selon ce que le trajet porte. Ne lève jamais sur des valeurs nulles. */
export function capacityView(trip: CapacityFields): CapacityView {
  if (isVolumeTrip(trip)) {
    const total = trip.volumeCapacityM3 ?? 0
    const left = trip.availableVolumeM3 ?? total
    const used = Math.max(total - left, 0)
    return {
      pct: total > 0 ? Math.round((used / total) * 100) : 0,
      label: `${formatM3(used)} / ${formatM3(total)} m³`,
    }
  }
  const total = trip.availableWeightKg
  const used = trip.usedWeightKg
  if (total == null || used == null) return { pct: 0, label: '' }
  return { pct: total > 0 ? Math.round((used / total) * 100) : 0, label: `${used} / ${total} kg` }
}

/** Prix net du voyageur : au kilo ou au m³ ; tiret quand le trajet ne porte aucun prix. */
export function priceLabel(trip: CapacityFields): string {
  if (trip.pricePerKg != null) return formatPerKg(trip.pricePerKg, trip.currency)
  if (trip.pricePerM3 != null) return formatPerM3(trip.pricePerM3, trip.currency)
  return '-'
}
