import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (class merger)', () => {
  it('combines classes', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })

  it('overrides conflicting Tailwind utilities (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles falsy values', () => {
    expect(cn('px-2', false, null, undefined, 'py-4')).toBe('px-2 py-4')
  })
})
