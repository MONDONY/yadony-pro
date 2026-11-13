import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const APP_DIR = join(process.cwd(), 'app')
const FORBIDDEN = /\b(vol de nuit|avant le vol|Aéroport|AF\d{3}|cabine|embarquement)\b/i

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return vueFiles(full)
    return full.endsWith('.vue') ? [full] : []
  })
}

const FORBIDDEN_ESCROW = /séquestré jusqu'à la livraison|séquestré jusqu’à la livraison|bloqué jusqu'à la livraison|bloqué jusqu’à la livraison/i

describe('textes sans hypothèse d’avion', () => {
  it('aucun écran de Yadony Pro ne suppose l’avion (vol de nuit, aéroport, cabine, embarquement)', () => {
    const offenders = vueFiles(APP_DIR)
      .filter((file) => !/features\/landing\/.*billets/i.test(file))
      .filter((file) => FORBIDDEN.test(readFileSync(file, 'utf8')))
      .map((file) => relative(APP_DIR, file))
    expect(offenders, `Fichiers fautifs : ${offenders.join(', ')}`).toEqual([])
  })

  it('aucun écran ne promet un séquestre jusqu’à la livraison (le bateau est versé au dépôt)', () => {
    const offenders = vueFiles(APP_DIR)
      .filter((file) => FORBIDDEN_ESCROW.test(readFileSync(file, 'utf8')))
      .map((file) => relative(APP_DIR, file))
    expect(offenders, `Fichiers fautifs : ${offenders.join(', ')}`).toEqual([])
  })
})
