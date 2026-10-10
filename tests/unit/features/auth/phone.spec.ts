import { describe, it, expect } from 'vitest'
import { COUNTRIES, DEFAULT_COUNTRY, countryForCode, type Country } from '@/features/auth/data/countries'
import { cleanPhone, countryForInternational, internationalForm, isValidE164, toE164 } from '@/features/auth/lib/phone'

const c = (code: string): Country => countryForCode(code)!

describe('COUNTRIES (FLUTTER-JD)', () => {
  it('reprend les pays de l’application mobile, plus la Guinée', () => {
    const app = [
      'DE', 'AT', 'BE', 'CY', 'HR', 'ES', 'EE', 'FI', 'FR', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT',
      'NL', 'PT', 'GB', 'SK', 'SI', 'CH', 'CA', 'US', 'BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG',
      'CM', 'CF', 'CG', 'GA', 'GQ', 'TD', 'CD',
    ]
    expect(COUNTRIES.map(x => x.code).sort()).toEqual([...app, 'GN'].sort())
  })

  it('n’a aucun doublon de code ISO', () => {
    expect(new Set(COUNTRIES.map(x => x.code)).size).toBe(COUNTRIES.length)
  })

  it('propose les États-Unis et le Canada en +1', () => {
    expect(c('US').dial).toBe('+1')
    expect(c('CA').dial).toBe('+1')
  })

  it('propose tous les pays UEMOA et CEMAC', () => {
    for (const code of ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG', 'CM', 'CF', 'CG', 'GA', 'GQ', 'TD']) {
      expect(countryForCode(code), code).toBeDefined()
    }
  })

  it('garde la Guinée', () => {
    expect(c('GN').dial).toBe('+224')
  })

  it('garde la France par défaut et les pays principaux en tête', () => {
    expect(DEFAULT_COUNTRY.code).toBe('FR')
    expect(COUNTRIES.slice(0, 6).map(x => x.code)).toEqual(['FR', 'SN', 'CI', 'ML', 'CM', 'GN'])
  })

  it('trie les autres pays par ordre alphabétique', () => {
    const rest = COUNTRIES.slice(6).map(x => x.name)
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b, 'fr')))
  })

  it('countryForCode ignore la casse et les espaces, undefined si inconnu', () => {
    expect(countryForCode(' us ')?.code).toBe('US')
    expect(countryForCode('ZZ')).toBeUndefined()
  })
})

describe('toE164', () => {
  it('accepte un numéro américain saisi après +1', () => {
    expect(toE164(c('US'), '713 555 0100')).toBe('+17135550100')
  })

  it('accepte un numéro canadien saisi après +1', () => {
    expect(toE164(c('CA'), '(514) 555-0123')).toBe('+15145550123')
  })

  it('utilise tel quel un numéro collé en +1, quel que soit le pays choisi', () => {
    expect(toE164(c('FR'), '+1 713 555 0100')).toBe('+17135550100')
  })

  it('convertit le préfixe 00 en +', () => {
    expect(toE164(c('FR'), '0033 6 12 34 56 78')).toBe('+33612345678')
    expect(toE164(c('SN'), '00 1 713 555 0100')).toBe('+17135550100')
  })

  it('retire le 0 national en France', () => {
    expect(toE164(c('FR'), '06 12 34 56 78')).toBe('+33612345678')
    expect(toE164(c('FR'), '06.12.34.56.78')).toBe('+33612345678')
  })

  it('garde le 0 en Côte d’Ivoire et en Italie', () => {
    expect(toE164(c('CI'), '07 48 84 08 74')).toBe('+2250748840874')
    expect(toE164(c('IT'), '06 1234 5678')).toBe('+390612345678')
  })

  it('ne traite pas « 00 » comme international sans indicatif connu', () => {
    expect(toE164(c('GB'), '007911123456')).toBe('+4407911123456')
  })

  it('renvoie l’indicatif seul pour une saisie vide', () => {
    expect(toE164(c('FR'), '  ')).toBe('+33')
  })
})

describe('isValidE164', () => {
  it('accepte un numéro E.164', () => {
    expect(isValidE164('+17135550100')).toBe(true)
    expect(isValidE164('+33612345678')).toBe(true)
  })

  it('refuse les saisies invalides', () => {
    expect(isValidE164('+33')).toBe(false)
    expect(isValidE164('+33123')).toBe(false)
    expect(isValidE164('+33+17135550100')).toBe(false)
    expect(isValidE164('+33abc45678')).toBe(false)
    expect(isValidE164('+0612345678')).toBe(false)
    expect(isValidE164('+1234567890123456')).toBe(false)
  })
})

describe('détection du pays', () => {
  it('cleanPhone retire espaces, tirets, points et parenthèses', () => {
    expect(cleanPhone(' +1 (713) 555-01.00 ')).toBe('+17135550100')
  })

  it('internationalForm reconnaît + et 00, sinon undefined', () => {
    expect(internationalForm('+44 7911')).toBe('+447911')
    expect(internationalForm('0044 7911')).toBe('+447911')
    expect(internationalForm('06 12')).toBeUndefined()
    expect(internationalForm('007911')).toBeUndefined()
  })

  it('choisit l’indicatif le plus long', () => {
    expect(countryForInternational('+2250748840874')?.code).toBe('CI')
    expect(countryForInternational('+33612345678')?.code).toBe('FR')
    expect(countryForInternational('243812345678')?.code).toBe('CD')
  })

  it('préfère les États-Unis pour +1, mais garde le Canada déjà choisi', () => {
    expect(countryForInternational('+17135550100')?.code).toBe('US')
    expect(countryForInternational('+17135550100', c('FR'))?.code).toBe('US')
    expect(countryForInternational('+15145550123', c('CA'))?.code).toBe('CA')
  })

  it('renvoie undefined pour un indicatif inconnu', () => {
    expect(countryForInternational('+7912')).toBeUndefined()
  })
})
