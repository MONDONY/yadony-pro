// app/lib/commissionGrid.ts
//
// Commission par paliers : portage TypeScript du `CommissionCalculator` du back
// (yadony-back, common/commission), HORS réductions personnelles (taux spécial,
// code promo, bon de parrainage), que le portail ne connaît pas. Source de vérité
// des chiffres : le back, qui sert les montants définitifs ; ce module ne sert
// qu'aux aperçus et aux replis quand le back ne les fournit pas.
//
// Règle (spec back 2026-10-18, §4.2 et §4.3) :
//   1. grille marginale : Σ taux_i × part du net comprise dans la tranche i, les
//      bornes saisies en euros étant converties dans la devise SANS arrondi ;
//   2. minimum de la devise (sauf commission de grille nulle) ;
//   3. un seul arrondi HALF_UP à l'unité mineure de la devise, à la fin.
//
// Tous les calculs se font en fractions exactes (BigInt) : aucun flottant, donc
// aucun écart d'un centime avec le BigDecimal du back.

export interface CommissionTier {
  /** Borne basse de la tranche, en euros. */
  fromEur: number | string
  /** Taux marginal de la tranche (0,07 pour 7 %). */
  rate: number | string
}

export interface CommissionGrid {
  gridId?: string
  effectiveFrom?: string
  tiers: CommissionTier[]
  /** Commission minimum par code devise, dans l'unité de la devise. */
  minimums: Record<string, number | string>
}

export interface CommissionQuote {
  /** Net du voyageur, ramené à l'unité mineure de la devise. */
  net: number
  commission: number
  /** Total payé par l'expéditeur : net + commission. */
  gross: number
  /** Vrai quand le minimum de la devise a relevé la commission. */
  minimumApplied: boolean
}

/** Contexte de commission chargé depuis le back : grille en vigueur, sinon taux unique. */
export interface CommissionContext {
  grid: CommissionGrid | null
  rate: number | null
}

/** Devises du back (`SupportedCurrency`) : unités par euro (sans arrondi) et décimales. */
const CURRENCIES: Readonly<Record<string, { unitsPerEur: string; minorUnit: number }>> = {
  EUR: { unitsPerEur: '1', minorUnit: 2 },
  USD: { unitsPerEur: '1.08', minorUnit: 2 },
  CAD: { unitsPerEur: '1.47', minorUnit: 2 },
  GBP: { unitsPerEur: '0.86', minorUnit: 2 },
  CHF: { unitsPerEur: '0.95', minorUnit: 2 },
  XOF: { unitsPerEur: '655.957', minorUnit: 0 },
  XAF: { unitsPerEur: '655.957', minorUnit: 0 },
}

// ── Fractions exactes ───────────────────────────────────────────────────────

interface Frac {
  n: bigint
  d: bigint
}

const ZERO: Frac = { n: 0n, d: 1n }

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a
  let y = b < 0n ? -b : b
  while (y !== 0n) {
    ;[x, y] = [y, x % y]
  }
  return x
}

function frac(n: bigint, d: bigint): Frac {
  const g = gcd(n, d) || 1n
  return { n: n / g, d: d / g }
}

const add = (a: Frac, b: Frac): Frac => frac(a.n * b.d + b.n * a.d, a.d * b.d)
const sub = (a: Frac, b: Frac): Frac => frac(a.n * b.d - b.n * a.d, a.d * b.d)
const mul = (a: Frac, b: Frac): Frac => frac(a.n * b.n, a.d * b.d)
const cmp = (a: Frac, b: Frac): number => {
  const l = a.n * b.d
  const r = b.n * a.d
  return l < r ? -1 : l > r ? 1 : 0
}
const min = (a: Frac, b: Frac): Frac => (cmp(a, b) <= 0 ? a : b)
const max = (a: Frac, b: Frac): Frac => (cmp(a, b) >= 0 ? a : b)

/** « 12.5 », « 0.07 », « 1e-7 » ou un nombre → fraction exacte, null si illisible. */
function parseDecimal(value: number | string): Frac | null {
  const text = typeof value === 'number' ? (Number.isFinite(value) ? String(value) : '') : value.trim()
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(text)
  if (!m) return null
  const fraction = m[3] ?? ''
  let numerator = BigInt(m[2]! + fraction)
  let denominator = 10n ** BigInt(fraction.length)
  const exponent = m[4] ? Number(m[4]) : 0
  if (exponent > 0) numerator *= 10n ** BigInt(exponent)
  if (exponent < 0) denominator *= 10n ** BigInt(-exponent)
  if (m[1] === '-') numerator = -numerator
  return frac(numerator, denominator)
}

/** Arrondi HALF_UP (positifs) d'une fraction vers un entier. */
function roundHalfUp(a: Frac): bigint {
  return (2n * a.n + a.d) / (2n * a.d)
}

// ── Grille interne ──────────────────────────────────────────────────────────

interface ParsedTier {
  fromEur: Frac
  rate: Frac
}

function parseTiers(grid: CommissionGrid): ParsedTier[] | null {
  const tiers: ParsedTier[] = []
  for (const tier of grid.tiers) {
    const fromEur = parseDecimal(tier.fromEur)
    const rate = parseDecimal(tier.rate)
    if (!fromEur || !rate) return null
    tiers.push({ fromEur, rate })
  }
  if (tiers.length === 0) return null
  return tiers.sort((a, b) => cmp(a.fromEur, b.fromEur))
}

/** Commission de grille NON arrondie pour un net exprimé en unités de la devise. */
function gridCommission(net: Frac, tiers: ParsedTier[], unitsPerEur: Frac): Frac {
  let total = ZERO
  for (let i = 0; i < tiers.length; i++) {
    const lower = mul(tiers[i]!.fromEur, unitsPerEur)
    if (cmp(net, lower) <= 0) break
    const next = tiers[i + 1]
    const top = next ? min(net, mul(next.fromEur, unitsPerEur)) : net
    total = add(total, mul(tiers[i]!.rate, sub(top, lower)))
  }
  return total
}

interface Engine {
  minorUnit: number
  /** Commission en unités mineures (entier) pour un net en unités mineures. */
  commissionMinor: (netMinor: bigint) => { amount: bigint; minimumApplied: boolean }
}

function engineFor(currency: string, grid: CommissionGrid): Engine | null {
  const spec = CURRENCIES[currency.trim().toUpperCase()]
  if (!spec) return null
  const tiers = parseTiers(grid)
  const minimum = parseDecimal(grid.minimums[currency.trim().toUpperCase()] ?? '')
  const unitsPerEur = parseDecimal(spec.unitsPerEur)
  if (!tiers || !minimum || !unitsPerEur) return null
  const scale = 10n ** BigInt(spec.minorUnit)
  return {
    minorUnit: spec.minorUnit,
    commissionMinor(netMinor) {
      const net = frac(netMinor, scale)
      const base = gridCommission(net, tiers, unitsPerEur)
      // Commission de grille nulle (tranche à 0 %) : ni minimum, comme le back.
      if (base.n === 0n) return { amount: 0n, minimumApplied: false }
      const minimumApplied = cmp(base, minimum) < 0
      return { amount: roundHalfUp(mul(max(base, minimum), frac(scale, 1n))), minimumApplied }
    },
  }
}

function toNumber(minor: bigint, minorUnit: number): number {
  return Number(minor) / 10 ** minorUnit
}

// ── API publique ────────────────────────────────────────────────────────────

/**
 * Devis pour un net voyageur : commission, total payé par l'expéditeur et
 * indicateur de minimum. `null` si le net est illisible ou nul, la devise inconnue
 * ou la grille incomplète (pas de minimum pour la devise) : l'appelant n'affiche
 * alors rien plutôt qu'un montant inventé.
 */
export function quoteCommission(
  net: number | string,
  currency: string,
  grid: CommissionGrid,
): CommissionQuote | null {
  const engine = engineFor(currency, grid)
  const parsed = parseDecimal(net)
  if (!engine || !parsed) return null
  const scale = 10n ** BigInt(engine.minorUnit)
  const netMinor = roundHalfUp(mul(parsed, frac(scale, 1n)))
  if (netMinor <= 0n) return null
  const { amount, minimumApplied } = engine.commissionMinor(netMinor)
  return {
    net: toNumber(netMinor, engine.minorUnit),
    commission: toNumber(amount, engine.minorUnit),
    gross: toNumber(netMinor + amount, engine.minorUnit),
    minimumApplied,
  }
}

/** Total payé par l'expéditeur pour un net voyageur, `null` si le calcul est impossible. */
export function grossFromNet(net: number | string, currency: string, grid: CommissionGrid): number | null {
  return quoteCommission(net, currency, grid)?.gross ?? null
}

/**
 * Calcul inverse : plus grand net `N` (à l'unité mineure) tel que `N + C(N) ≤ gross`.
 * `null` quand le budget ne couvre même pas la commission minimum (le back répond
 * 422 `budget-below-commission-minimum`), ou quand le calcul est impossible.
 * Recherche dichotomique exacte : `N ↦ N + C(N)` est strictement croissante.
 */
export function netForGross(
  gross: number | string,
  currency: string,
  grid: CommissionGrid,
): { net: number; commission: number } | null {
  const engine = engineFor(currency, grid)
  const parsed = parseDecimal(gross)
  if (!engine || !parsed) return null
  const scale = 10n ** BigInt(engine.minorUnit)
  const grossMinor = (parsed.n * scale) / parsed.d // plancher (positifs)
  const grossOf = (netMinor: bigint) => netMinor + engine.commissionMinor(netMinor).amount

  let lo = 1n
  let hi = grossMinor
  if (hi < lo || grossOf(lo) > grossMinor) return null
  while (lo < hi) {
    const mid = lo + (hi - lo + 1n) / 2n
    if (grossOf(mid) <= grossMinor) lo = mid
    else hi = mid - 1n
  }
  return {
    net: toNumber(lo, engine.minorUnit),
    commission: toNumber(engine.commissionMinor(lo).amount, engine.minorUnit),
  }
}

/** Commission minimum de la grille dans la devise, `null` si la grille ne la porte pas. */
export function minimumFor(grid: CommissionGrid | null, currency: string): number | null {
  if (!grid) return null
  const parsed = parseDecimal(grid.minimums[currency.trim().toUpperCase()] ?? '')
  if (!parsed || parsed.n <= 0n) return null
  return Number(parsed.n) / Number(parsed.d)
}

/**
 * Total payé par l'expéditeur pour un net voyageur : par la grille quand elle est
 * en vigueur, sinon par le taux unique, sinon `null` (jamais de taux inventé).
 */
export function senderTotalFromNet(net: number, currency: string, context: CommissionContext): number | null {
  if (!Number.isFinite(net)) return null
  if (context.grid) return grossFromNet(net, currency, context.grid)
  if (context.rate === null) return null
  const rate = parseDecimal(context.rate)
  const netValue = parseDecimal(net)
  if (!rate || !netValue || netValue.n < 0n) return null
  // Même ordre que `PriceBreakdown.fromNet` du back, en fractions exactes : net
  // arrondi HALF_UP, commission = net arrondi × taux arrondie HALF_UP, brut = net +
  // commission. L'unité mineure est celle de la devise (2 décimales, 0 en francs CFA).
  const minorUnit = CURRENCIES[currency.trim().toUpperCase()]?.minorUnit ?? 2
  const scale = frac(10n ** BigInt(minorUnit), 1n)
  const netMinor = roundHalfUp(mul(netValue, scale))
  const commissionMinor = roundHalfUp(mul(frac(netMinor, 1n), rate))
  return toNumber(netMinor + commissionMinor, minorUnit)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDecimalInput(value: unknown): value is number | string {
  return (typeof value === 'number' || typeof value === 'string') && parseDecimal(value) !== null
}

/**
 * Lit la réponse de `GET /config/commission-grid` et rend la grille en vigueur
 * (`current`), ou `null` sans grille ou si la charge est illisible : le portail
 * retombe alors sur le taux unique.
 */
export function parseCommissionGrid(payload: unknown): CommissionGrid | null {
  if (!isRecord(payload) || !isRecord(payload.current)) return null
  const current = payload.current
  if (!Array.isArray(current.tiers) || current.tiers.length === 0 || !isRecord(current.minimums)) return null

  const tiers: CommissionTier[] = []
  for (const tier of current.tiers) {
    if (!isRecord(tier) || !isDecimalInput(tier.fromEur) || !isDecimalInput(tier.rate)) return null
    tiers.push({ fromEur: tier.fromEur, rate: tier.rate })
  }
  const minimums: Record<string, number | string> = {}
  for (const [code, value] of Object.entries(current.minimums)) {
    if (isDecimalInput(value)) minimums[code.toUpperCase()] = value
  }
  return {
    gridId: typeof current.gridId === 'string' ? current.gridId : undefined,
    effectiveFrom: typeof current.effectiveFrom === 'string' ? current.effectiveFrom : undefined,
    tiers,
    minimums,
  }
}
