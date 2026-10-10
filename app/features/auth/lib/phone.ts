import { COUNTRIES, type Country } from '../data/countries'

/**
 * Composition du numéro E.164 envoyé à Firebase Auth, alignée sur `toE164`
 * de l'application mobile (`dony_app/lib/core/phone/phone_country.dart`).
 */

/** Pays retenu quand plusieurs partagent un indicatif et qu'aucun n'est choisi. */
const PREFERRED_FOR_DIAL: Record<string, string> = { '+1': 'US' }

const E164 = /^\+[1-9]\d{7,14}$/

/** Retire les séparateurs de confort : espaces, tirets, points, parenthèses. */
export function cleanPhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, '')
}

/**
 * Pays dont l'indicatif ouvre ce numéro international (`+…`), ou `undefined`.
 * L'indicatif le plus long l'emporte. Entre pays de même indicatif (`+1`),
 * le pays déjà choisi est conservé.
 */
export function countryForInternational(international: string, current?: Country): Country | undefined {
  const digits = international.startsWith('+') ? international : `+${international}`
  let best: Country[] = []
  for (const c of COUNTRIES) {
    if (!digits.startsWith(c.dial)) continue
    if (best.length === 0 || c.dial.length > best[0]!.dial.length) best = [c]
    else if (c.dial.length === best[0]!.dial.length) best.push(c)
  }
  if (best.length === 0) return undefined
  if (current && best.some(c => c.code === current.code)) return current
  const preferred = PREFERRED_FOR_DIAL[best[0]!.dial]
  return best.find(c => c.code === preferred) ?? best[0]
}

/**
 * Numéro saisi déjà au format international (`+…` ou `00` suivi d'un indicatif
 * connu), ramené à `+…` ; `undefined` sinon.
 */
export function internationalForm(raw: string): string | undefined {
  const cleaned = cleanPhone(raw)
  if (cleaned.startsWith('+')) return cleaned
  // « 00 » n'est un préfixe international que s'il précède un indicatif connu :
  // « 007911… » au Royaume-Uni reste une saisie nationale.
  if (cleaned.startsWith('00') && countryForInternational(cleaned.slice(2))) {
    return `+${cleaned.slice(2)}`
  }
  return undefined
}

/**
 * Compose le numéro E.164 à partir du pays choisi et de la saisie brute.
 * Le zéro initial n'est retiré que dans les pays où il est un préfixe
 * interurbain (France, Royaume-Uni…), jamais ailleurs (Côte d'Ivoire, Italie…).
 */
export function toE164(country: Country, raw: string): string {
  const cleaned = cleanPhone(raw)
  if (cleaned === '') return country.dial
  const international = internationalForm(cleaned)
  if (international) return international
  const local = country.strip && cleaned.startsWith('0') ? cleaned.slice(1) : cleaned
  return `${country.dial}${local}`
}

export function isValidE164(phone: string): boolean {
  return E164.test(phone)
}
