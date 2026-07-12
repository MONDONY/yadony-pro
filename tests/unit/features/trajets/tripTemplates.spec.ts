import { describe, it, expect } from 'vitest'
import { TRIP_TEMPLATES } from '@/features/trajets/data/tripTemplates'

describe('tripTemplates — catégories par défaut', () => {
  it('utilise les libellés canoniques du catalogue (pas les anciens libellés courts)', () => {
    for (const t of TRIP_TEMPLATES) {
      expect(t.acceptedCategories).toEqual([
        'Vêtements & tissus',
        'Documents & administratif',
        'Cosmétiques & parfums',
      ])
    }
  })
})
