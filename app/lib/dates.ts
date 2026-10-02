/** Au-delà de ce délai après le départ, le backend refuse l'arrivée (ArrivalRules, « arrival-too-far »). */
export const MAX_ARRIVAL_DAYS_AFTER_DEPARTURE = 3

/** Ajoute `days` jours à une date `YYYY-MM-DD` sans passer par le fuseau local. */
export function addDaysToDateInput(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]!
}
