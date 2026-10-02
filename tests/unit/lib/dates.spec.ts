import { describe, it, expect } from 'vitest'
import { addDaysToDateInput, daysBetweenDateInputs, MAX_ARRIVAL_DAYS_AFTER_DEPARTURE } from '@/lib/dates'

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

  it('aligne le délai maximal sur le backend', () => {
    expect(MAX_ARRIVAL_DAYS_AFTER_DEPARTURE).toBe(3)
  })
})
