import { describe, it, expect } from 'vitest'
import {
  addDaysToDateInput,
  daysBetweenDateInputs,
  maxArrivalDaysAfterDeparture,
  arrivalDateError,
  MAX_TEMPLATE_ARRIVAL_OFFSET_DAYS,
} from '@/lib/dates'

describe('dates', () => {
  it('ajoute des jours en franchissant mois et année', () => {
    expect(addDaysToDateInput('2026-06-01', 3)).toBe('2026-06-04')
    expect(addDaysToDateInput('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDaysToDateInput('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('compte les jours entre deux dates', () => {
    expect(daysBetweenDateInputs('2026-06-01', '2026-06-03')).toBe(2)
    expect(daysBetweenDateInputs('2026-06-02', '2026-06-01')).toBe(-1)
  })

  it('plafond par mode', () => {
    expect(maxArrivalDaysAfterDeparture('PLANE')).toBe(3)
    expect(maxArrivalDaysAfterDeparture('TRAIN')).toBe(3)
    expect(maxArrivalDaysAfterDeparture('OTHER')).toBe(3)
    expect(maxArrivalDaysAfterDeparture('CAR')).toBe(14)
    expect(maxArrivalDaysAfterDeparture('BUS')).toBe(14)
    expect(maxArrivalDaysAfterDeparture('BOAT')).toBe(120)
    expect(maxArrivalDaysAfterDeparture(null)).toBe(3)
  })

  it('les modèles restent bornés à 3 jours', () => {
    expect(MAX_TEMPLATE_ARRIVAL_OFFSET_DAYS).toBe(3)
  })

  it('J+10 : refusé en avion, accepté sur la route', () => {
    expect(arrivalDateError('2026-12-01', '', '2026-12-11', '', 'PLANE')).toBe(
      "L'arrivée doit avoir lieu au plus 3 jours après le départ",
    )
    expect(arrivalDateError('2026-12-01', '', '2026-12-11', '', 'CAR')).toBeNull()
    expect(arrivalDateError('2026-12-01', '', '2026-12-16', '', 'CAR')).toBe(
      "L'arrivée doit avoir lieu au plus 14 jours après le départ",
    )
  })

  it('arrivée avant le départ et même jour', () => {
    expect(arrivalDateError('2026-12-02', '', '2026-12-01', '', 'CAR')).toBe("La date d'arrivée ne peut pas précéder le départ")
    expect(arrivalDateError('2026-12-01', '10:00', '2026-12-01', '09:00', null)).toBe(
      "Le même jour, l'heure d'arrivée doit suivre l'heure de départ",
    )
    expect(arrivalDateError('', '', '2026-12-01', '', null)).toBeNull()
  })
})
