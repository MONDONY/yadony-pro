import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PRO_OFFER, PRO_ITEM_ICONS } from '@/features/abonnement/lib/proOffer'

/**
 * La page de vente n'a le droit de promettre que ce que l'abonnement ouvre vraiment.
 *
 * Deux dérives possibles, toutes deux silencieuses : une entrée ajoutée au catalogue sans
 * page derrière — une promesse creuse — et un libellé qui s'écarte de celui de la barre
 * latérale, si bien que l'utilisateur cherche dans le produit un mot qu'il a lu sur la
 * page d'achat. Ce fichier ferme les deux en lisant `AppSidebar` comme source de vérité.
 */
describe('catalogue de l’offre PRO', () => {
  const sidebar = readFileSync(
    resolve(process.cwd(), 'app/components/layout/AppSidebar.vue'),
    'utf8',
  )

  const allItems = PRO_OFFER.flatMap((group) => group.items)

  it('chaque entrée porte le libellé exact d’une entrée de la barre latérale', () => {
    const missing = allItems
      .map((item) => item.label)
      .filter((label) => !sidebar.includes(label))

    expect(
      missing,
      `Promesses sans page correspondante dans AppSidebar : ${missing.join(', ')}`,
    ).toEqual([])
  })

  it('aucune entrée n’est listée deux fois', () => {
    const labels = allItems.map((item) => item.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('chaque entrée porte une icône et une explication', () => {
    for (const item of allItems) {
      expect(PRO_ITEM_ICONS[item.label], `icône manquante pour ${item.label}`).toBeDefined()
      expect(item.detail.length, `explication vide pour ${item.label}`).toBeGreaterThan(10)
    }
  })

  it('les groupes sont nommés et non vides', () => {
    expect(PRO_OFFER.length).toBeGreaterThanOrEqual(3)
    for (const group of PRO_OFFER) {
      expect(group.title.length).toBeGreaterThan(2)
      expect(group.summary.length).toBeGreaterThan(10)
      expect(group.items.length).toBeGreaterThan(0)
    }
  })
})
