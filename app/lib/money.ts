// app/lib/money.ts
//
// Formatage et bornes monétaires dans la devise de CHAQUE montant. Le portail
// affichait « € » en dur sur des montants que le backend sert désormais dans la
// devise du trajet, de la demande ou du portefeuille : 5 000 F CFA devenait
// « 5 000,00 € ». Toute nouvelle ligne de montant passe par ici.

/** Devises sans sous-unité : montants en unité pleine, jamais de décimales. */
export const ZERO_DECIMAL_CURRENCIES: ReadonlySet<string> = new Set(['XOF', 'XAF'])

/**
 * Barème de la plateforme, aligné sur `SupportedCurrency` côté backend : sert à
 * mettre à l'échelle une borne fixée en euros (plafond d'une offre, minimum),
 * jamais à convertir un montant échangé entre deux utilisateurs.
 */
const UNITS_PER_EUR: Readonly<Record<string, number>> = {
  EUR: 1,
  USD: 1.08,
  CAD: 1.47,
  GBP: 0.86,
  CHF: 0.95,
  XOF: 655.957,
  XAF: 655.957,
}

/** Devises dont le backend accepte la carte bancaire (rail Stripe). */
const STRIPE_CURRENCIES: ReadonlySet<string> = new Set(['EUR', 'USD', 'CAD', 'GBP', 'CHF'])

/** Devises servies par le rail mobile money (pawaPay). */
const MOBILE_MONEY_CURRENCIES: ReadonlySet<string> = new Set(['XOF', 'XAF'])

/** Plafond d'une offre ou d'une contre-offre, en euros, avant mise à l'échelle. */
const MAX_NEGOTIATION_PRICE_EUR = 500

/** Code ISO en majuscules, EUR quand le backend n'a pas encore envoyé la devise. */
export function normalizeCurrency(code?: string | null): string {
  const normalized = (code ?? '').trim().toUpperCase()
  return normalized || 'EUR'
}

export function isZeroDecimal(code?: string | null): boolean {
  return ZERO_DECIMAL_CURRENCIES.has(normalizeCurrency(code))
}

/** Nombre de décimales que la devise autorise : 0 en francs CFA, 2 ailleurs. */
export function fractionDigits(code?: string | null): 0 | 2 {
  return isZeroDecimal(code) ? 0 : 2
}

export function isStripeCurrency(code?: string | null): boolean {
  return STRIPE_CURRENCIES.has(normalizeCurrency(code))
}

export function isMobileMoneyCurrency(code?: string | null): boolean {
  return MOBILE_MONEY_CURRENCIES.has(normalizeCurrency(code))
}

/**
 * Arrondit un montant à la précision de sa devise (unité pleine en francs CFA,
 * centime ailleurs), pour qu'un calcul côté portail (revenu net, prix au kilo)
 * ne fabrique pas de « 60,48 F CFA ».
 */
export function roundToCurrency(amount: number, code?: string | null): number {
  const factor = isZeroDecimal(code) ? 1 : 100
  return Math.round(amount * factor) / factor
}

/**
 * Formate un montant exprimé en unités principales (euros, francs) dans sa
 * devise, en français. `minor: true` quand le montant arrive en unités mineures
 * (centimes) : il est alors ramené en unités principales, sauf pour les devises
 * sans sous-unité dont les montants sont déjà en unité pleine.
 */
export function formatMoney(
  amount: number | null | undefined,
  currency?: string | null,
  options: { minor?: boolean } = {},
): string {
  const code = normalizeCurrency(currency)
  const safe = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
  const value = options.minor && !isZeroDecimal(code) ? safe / 100 : safe
  const digits = fractionDigits(code)
  try {
    return value.toLocaleString('fr-FR', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  } catch {
    // Code hors ISO 4217 : ne jamais casser un écran pour un formatage.
    return `${value.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${code}`
  }
}

/** « 12,50 €/kg », « 5 000 F CFA/kg ». */
export function formatPerKg(amount: number | null | undefined, currency?: string | null): string {
  return `${formatMoney(amount, currency)}/kg`
}

/** Symbole seul (« € », « F CFA », « $US »), pour un suffixe de champ de saisie. */
export function currencySymbol(currency?: string | null): string {
  const code = normalizeCurrency(currency)
  try {
    const parts = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: code }).formatToParts(1)
    const symbol = parts.find((p) => p.type === 'currency')?.value
    return symbol || code
  } catch {
    return code
  }
}

/**
 * Exprime dans `currency` une borne fixée en euros par la plateforme, arrondie à
 * la précision de la devise. Réservé aux barèmes de la plateforme.
 */
export function scaleFromEur(amountEur: number, currency?: string | null): number {
  const code = normalizeCurrency(currency)
  const units = UNITS_PER_EUR[code] ?? 1
  return roundToCurrency(amountEur * units, code)
}

/** Plafond d'une offre ou d'une contre-offre dans la devise du fil (500 € à l'échelle). */
export function maxNegotiationPrice(currency?: string | null): number {
  return scaleFromEur(MAX_NEGOTIATION_PRICE_EUR, currency)
}

/** Plancher d'une offre dans la devise du fil (1 € à l'échelle). */
export function minNegotiationPrice(currency?: string | null): number {
  return scaleFromEur(1, currency)
}

/** Pas de saisie d'un champ montant : 1 en francs CFA, 0,01 ailleurs. */
export function amountStep(currency?: string | null): number {
  return isZeroDecimal(currency) ? 1 : 0.01
}

/**
 * Propositions de prix au kilo du formulaire de trajet, dans la devise du
 * trajet : quatre paliers ronds, dont le troisième sert de valeur par défaut.
 */
export function pricePerKgOptions(currency?: string | null): number[] {
  return isZeroDecimal(currency) ? [3000, 4000, 5000, 6000] : [5, 6, 7, 8]
}

export function defaultPricePerKg(currency?: string | null): number {
  return pricePerKgOptions(currency)[2]!
}

/** Pas des boutons + / − d'un prix : 1 dans une devise à centimes, 500 en francs CFA. */
export function priceStep(currency?: string | null): number {
  return isZeroDecimal(currency) ? 500 : 1
}

/**
 * Moyens de paiement à déclarer sur un trajet pour sa devise : carte en zone
 * Stripe, mobile money en zone CFA où les espèces sont toujours proposées (le
 * backend n'y garde de toute façon que ces deux rails). Hors zone CFA les
 * espèces restent un choix explicite du voyageur.
 */
export function paymentMethodsFor(currency?: string | null, options: { cash?: boolean } = {}): string[] {
  const methods: string[] = []
  if (isStripeCurrency(currency)) methods.push('STRIPE')
  if (isMobileMoneyCurrency(currency)) methods.push('MOBILE_MONEY')
  if (options.cash || isMobileMoneyCurrency(currency)) methods.push('CASH')
  return methods
}
