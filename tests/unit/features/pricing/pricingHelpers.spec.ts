import { describe, it, expect } from 'vitest'
import { netPerKg, compareToMarket } from '@/features/pricing/types/index'

describe('netPerKg', () => {
  it('subtracts the commission and rounds to cents', () => {
    expect(netPerKg(10, 0.12)).toBe(8.8)
    expect(netPerKg(15, 0.15)).toBe(12.75)
  })

  it('returns 0 for negative or non-finite prices', () => {
    expect(netPerKg(-5, 0.12)).toBe(0)
    expect(netPerKg(Number.NaN, 0.12)).toBe(0)
  })
})

describe('compareToMarket', () => {
  it('returns unknown when the median is null or invalid', () => {
    expect(compareToMarket(10, null)).toBe('unknown')
    expect(compareToMarket(10, 0)).toBe('unknown')
    expect(compareToMarket(Number.NaN, 12)).toBe('unknown')
  })

  it('returns aligned within ±5% of the median', () => {
    expect(compareToMarket(10, 10)).toBe('aligned')
    expect(compareToMarket(10.4, 10)).toBe('aligned')
    expect(compareToMarket(9.6, 10)).toBe('aligned')
  })

  it('returns above and below outside the ±5% band', () => {
    expect(compareToMarket(12, 10)).toBe('above')
    expect(compareToMarket(8, 10)).toBe('below')
  })
})
