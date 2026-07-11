import { describe, it, expect } from 'vitest'
import { extractProblem } from '@/lib/apiError'

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
