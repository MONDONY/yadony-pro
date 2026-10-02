import { describe, it, expect } from 'vitest'
import { addDaysToDateInput, MAX_ARRIVAL_DAYS_AFTER_DEPARTURE } from '@/lib/dates'

describe('dates', () => {
  it('ajoute des jours en franchissant mois et année', () => {
    expect(addDaysToDateInput('2026-06-01', 3)).toBe('2026-06-04')
    expect(addDaysToDateInput('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDaysToDateInput('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('aligne le délai maximal sur le backend', () => {
    expect(MAX_ARRIVAL_DAYS_AFTER_DEPARTURE).toBe(3)
  })
})
