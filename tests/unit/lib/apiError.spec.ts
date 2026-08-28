import { describe, it, expect } from 'vitest'
import { extractProblem, TECHNICAL_ERROR_PATTERN } from '@/lib/apiError'

describe('extractProblem', () => {
  it('extrait code et detail d\'un ProblemDetail RFC 7807', () => {
    const err = { data: { code: 'draft-limit-reached', detail: 'Limite de brouillons atteinte.', status: 403 } }
    expect(extractProblem(err)).toEqual({ code: 'draft-limit-reached', detail: 'Limite de brouillons atteinte.' })
  })

  it('renvoie des nulls quand l\'erreur n\'a pas de corps ProblemDetail', () => {
    expect(extractProblem(new Error('network'))).toEqual({ code: null, detail: null })
    expect(extractProblem(null)).toEqual({ code: null, detail: null })
    expect(extractProblem({ data: 'oops' })).toEqual({ code: null, detail: null })
  })

  it('ignore les champs non-string', () => {
    expect(extractProblem({ data: { code: 42, detail: {} } })).toEqual({ code: null, detail: null })
  })
})

// Partagé par friendlyAuthError et useSubscription : un seul filtre, jamais
// deux copies qui pourraient diverger silencieusement.
describe('TECHNICAL_ERROR_PATTERN', () => {
  it('détecte un détail technique (verbe HTTP, URL ou code de statut)', () => {
    expect(TECHNICAL_ERROR_PATTERN.test('[GET] https://api.dony.io/billing/checkout-session: 500')).toBe(true)
    expect(TECHNICAL_ERROR_PATTERN.test('https://api.dony.io/billing/subscription')).toBe(true)
    expect(TECHNICAL_ERROR_PATTERN.test('/api/billing/subscription')).toBe(true)
    expect(TECHNICAL_ERROR_PATTERN.test('Erreur : 500')).toBe(true)
  })

  it('laisse passer une phrase française sans jargon technique', () => {
    expect(TECHNICAL_ERROR_PATTERN.test('Le service est temporairement indisponible.')).toBe(false)
    expect(TECHNICAL_ERROR_PATTERN.test("L'abonnement n'est pas encore ouvert.")).toBe(false)
  })
})
