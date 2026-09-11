// tests/unit/lib/money.spec.ts
import { describe, it, expect } from 'vitest'
import {
  amountStep,
  budgetPerKgFilterOptions,
  currencySymbol,
  formatMoney,
  formatPerKg,
  fractionDigits,
  isMobileMoneyCurrency,
  isStripeCurrency,
  isZeroDecimal,
  maxNegotiationPrice,
  minNegotiationPrice,
  normalizeCurrency,
  paymentMethodsFor,
  priceStep,
  roundToCurrency,
  scaleFromEur,
} from '@/lib/money'

/** `toLocaleString('fr-FR')` sépare avec des espaces insécables : on compare sans elles. */
const compact = (s: string) => s.replace(/[\s  ]/g, '')

describe('money', () => {
  it('normalise le code et retombe sur EUR', () => {
    expect(normalizeCurrency('xof')).toBe('XOF')
    expect(normalizeCurrency(' eur ')).toBe('EUR')
    expect(normalizeCurrency(undefined)).toBe('EUR')
    expect(normalizeCurrency('')).toBe('EUR')
  })

  it('connaît les devises sans sous-unité', () => {
    expect(isZeroDecimal('XOF')).toBe(true)
    expect(isZeroDecimal('xaf')).toBe(true)
    expect(isZeroDecimal('EUR')).toBe(false)
    expect(fractionDigits('XOF')).toBe(0)
    expect(fractionDigits('USD')).toBe(2)
    expect(amountStep('XOF')).toBe(1)
    expect(amountStep('EUR')).toBe(0.01)
  })

  it('formate un montant dans sa devise, en français', () => {
    expect(compact(formatMoney(12.5, 'EUR'))).toBe('12,50€')
    expect(compact(formatMoney(5000, 'XOF'))).toBe('5000FCFA')
    expect(compact(formatMoney(5000, 'xaf'))).toBe('5000FCFA')
    expect(compact(formatMoney(1234.567, 'EUR'))).toBe('1234,57€')
  })

  it('accepte des unités mineures, sauf pour les devises sans sous-unité', () => {
    expect(compact(formatMoney(1250, 'EUR', { minor: true }))).toBe('12,50€')
    expect(compact(formatMoney(5000, 'XOF', { minor: true }))).toBe('5000FCFA')
  })

  it('ne casse jamais sur un montant absent ou un code inconnu', () => {
    expect(compact(formatMoney(null, 'EUR'))).toBe('0,00€')
    expect(compact(formatMoney(Number.NaN, 'XOF'))).toBe('0FCFA')
    expect(compact(formatMoney(12, 'ZZZ'))).toBe('12,00ZZZ')
    expect(compact(formatMoney(12))).toBe('12,00€')
  })

  it('formate un prix au kilo', () => {
    expect(compact(formatPerKg(20000, 'XOF'))).toBe('20000FCFA/kg')
    expect(compact(formatPerKg(12, 'EUR'))).toBe('12,00€/kg')
  })

  it('donne le symbole seul', () => {
    expect(currencySymbol('EUR')).toBe('€')
    expect(currencySymbol('XOF')).toMatch(/F\s?CFA/)
    expect(currencySymbol('ZZZ')).toBe('ZZZ')
    expect(currencySymbol(undefined)).toBe('€')
  })

  it('arrondit à la précision de la devise', () => {
    expect(roundToCurrency(60.48, 'XOF')).toBe(60)
    expect(roundToCurrency(60.485, 'EUR')).toBe(60.49)
    expect(roundToCurrency(10.004, 'EUR')).toBe(10)
  })

  it('met un barème en euros à l’échelle de la devise', () => {
    expect(scaleFromEur(500, 'EUR')).toBe(500)
    expect(scaleFromEur(500, 'XOF')).toBe(327979)
    expect(scaleFromEur(1, 'XOF')).toBe(656)
    expect(scaleFromEur(10, 'USD')).toBe(10.8)
    expect(scaleFromEur(10, 'ZZZ')).toBe(10)
  })

  it('borne les offres dans la devise du fil', () => {
    expect(maxNegotiationPrice('EUR')).toBe(500)
    expect(maxNegotiationPrice('XOF')).toBe(327979)
    expect(minNegotiationPrice('EUR')).toBe(1)
    expect(minNegotiationPrice('XAF')).toBe(656)
  })

  it('sait quel rail une devise autorise', () => {
    expect(isStripeCurrency('EUR')).toBe(true)
    expect(isStripeCurrency('CAD')).toBe(true)
    expect(isStripeCurrency('XOF')).toBe(false)
    expect(isMobileMoneyCurrency('XOF')).toBe(true)
    expect(isMobileMoneyCurrency('XAF')).toBe(true)
    expect(isMobileMoneyCurrency('EUR')).toBe(false)
  })

  it('donne un pas de prix lisible dans la devise', () => {
    expect(priceStep('EUR')).toBe(1)
    expect(priceStep('XOF')).toBe(500)
  })

  it('déclare les moyens de paiement que la devise autorise', () => {
    expect(paymentMethodsFor('EUR')).toEqual(['STRIPE'])
    expect(paymentMethodsFor('EUR', { cash: true })).toEqual(['STRIPE', 'CASH'])
    expect(paymentMethodsFor('XOF')).toEqual(['MOBILE_MONEY', 'CASH'])
    expect(paymentMethodsFor('xaf', { cash: false })).toEqual(['MOBILE_MONEY', 'CASH'])
    expect(paymentMethodsFor(undefined)).toEqual(['STRIPE'])
  })

  it('donne des paliers de filtre budget lisibles dans la devise', () => {
    expect(budgetPerKgFilterOptions('EUR')).toEqual([5, 8, 10, 15])
    expect(budgetPerKgFilterOptions('XOF')).toEqual([3000, 5000, 7000, 10000])
  })
})
