import type { TransportMode } from '@/features/trajets/types/index'

/**
 * Au-delà de ce délai après le départ, le backend refuse l'arrivée (ArrivalRules, « arrival-too-far »).
 * Plafond par mode : avion, train et autre 3 jours ; route (voiture, bus) 14 jours ; bateau 120 jours.
 * Sans mode choisi : 3 jours.
 */
export function maxArrivalDaysAfterDeparture(mode: TransportMode | null): number {
  switch (mode) {
    case 'CAR':
    case 'BUS':
      return 14
    case 'BOAT':
      return 120
    default:
      return 3
  }
}

/** Décalage départ → arrivée des modèles et récurrences : le DTO back reste borné à 3 jours (`@Max(3)`). */
export const MAX_TEMPLATE_ARRIVAL_OFFSET_DAYS = 3

/** Ajoute `days` jours à une date `YYYY-MM-DD` sans passer par le fuseau local. */
export function addDaysToDateInput(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]!
}

/** Nombre de jours entre deux dates `YYYY-MM-DD` (négatif si `to` précède `from`). */
export function daysBetweenDateInputs(from: string, to: string): number {
  const ms = new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()
  return Math.round(ms / 86_400_000)
}

/**
 * Règles de la date d'arrivée, identiques à ArrivalRules côté dony-back.
 * Retourne le message à afficher, ou null si l'arrivée est valide (ou absente).
 */
export function arrivalDateError(
  departureDate: string,
  departureTime: string,
  arrivalDate: string,
  arrivalTime: string,
  mode: TransportMode | null = null,
): string | null {
  if (!departureDate || !arrivalDate) return null
  if (arrivalDate < departureDate) return "La date d'arrivée ne peut pas précéder le départ"
  const maxDays = maxArrivalDaysAfterDeparture(mode)
  if (arrivalDate > addDaysToDateInput(departureDate, maxDays)) {
    return `L'arrivée doit avoir lieu au plus ${maxDays} jours après le départ`
  }
  if (arrivalDate === departureDate && departureTime && arrivalTime && arrivalTime <= departureTime) {
    return "Le même jour, l'heure d'arrivée doit suivre l'heure de départ"
  }
  return null
}

/**
 * Date limite de dépôt au format ISO. Le voyageur ne choisit qu'un jour : on le borne
 * à la fin de journée, sauf si le départ a lieu ce jour-là — auquel cas la limite est
 * l'heure de départ, le backend refusant toute limite postérieure au départ.
 */
export function deadlineToIso(date: string, departureDate: string, departureTime: string): string | null {
  if (!date) return null
  if (departureTime && date === departureDate) {
    return new Date(`${date}T${departureTime}`).toISOString()
  }
  return new Date(`${date}T23:59:00`).toISOString()
}
