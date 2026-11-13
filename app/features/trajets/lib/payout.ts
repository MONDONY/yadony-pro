import type { Trip } from '@/features/trajets/types/index'

/**
 * Le transporteur est versé au dépôt du colis sur un trajet bateau, à la livraison sinon.
 * Le serveur fige le moment à l'acceptation du colis ; tant qu'il ne le sert pas (`payoutTrigger`),
 * il se déduit du mode du trajet.
 */
export function isDepositPayout(
  trip: Pick<Trip, 'transportMode'>,
  payoutTrigger?: string | null,
): boolean {
  if (payoutTrigger) return payoutTrigger === 'DEPOSIT'
  return trip.transportMode === 'BOAT'
}

/** Vue générale du trajet : « Versé au dépôt de chaque colis » ou « Versé à la livraison de chaque colis ». */
export function payoutMomentLabel(
  trip: Pick<Trip, 'transportMode'>,
  payoutTrigger?: string | null,
): string {
  return isDepositPayout(trip, payoutTrigger)
    ? 'Versé au dépôt de chaque colis'
    : 'Versé à la livraison de chaque colis'
}

/** Fiche d'un colis : le moment du versement pour ce colis. */
export function parcelPayoutLabel(
  mode: string | null | undefined,
  payoutTrigger?: string | null,
): string {
  return isDepositPayout({ transportMode: mode as Trip['transportMode'] }, payoutTrigger)
    ? 'Versé au transporteur au dépôt du colis'
    : 'Versé au transporteur à la livraison du colis'
}

/** Bas de l'onglet revenus : ce qui déclenche le virement. */
export function payoutHint(trip: Pick<Trip, 'transportMode'>, payoutTrigger?: string | null): string {
  return isDepositPayout(trip, payoutTrigger)
    ? 'Les colis déposés déclenchent le virement.'
    : 'Les colis livrés déclenchent le virement.'
}
