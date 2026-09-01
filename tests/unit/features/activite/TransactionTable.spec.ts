import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TransactionTable from '@/features/activite/components/TransactionTable.vue'
import type { TransactionRow } from '@/features/activite/types/index'

const zeroRow: TransactionRow = {
  tripId: 'a',
  corridor: 'Paris → Dakar',
  departureDate: '2026-06-10',
  parcelCount: 0,
  grossRevenue: 0,
  commission: 0,
  netRevenue: 0,
}

const paidRow: TransactionRow = {
  tripId: 'b',
  corridor: 'Lyon → Bamako',
  departureDate: '2026-06-24',
  parcelCount: 2,
  grossRevenue: 10000,
  commission: 800,
  netRevenue: 9200,
}

function cells(tripId: string, wrapper: ReturnType<typeof mount>) {
  return wrapper.find(`[data-test="transaction-row-${tripId}"]`).findAll('td')
}

describe('TransactionTable', () => {
  it('n\'affiche pas de "-0,00 €" quand la commission est nulle', () => {
    const wrapper = mount(TransactionTable, { props: { transactions: [zeroRow] } })
    const commissionCell = cells('a', wrapper)[4]
    expect(commissionCell.text()).not.toContain('-')
    expect(commissionCell.classes()).toContain('text-text-muted')
  })

  it('préfixe la commission d\'un « - » et la colore en danger quand elle est positive', () => {
    const wrapper = mount(TransactionTable, { props: { transactions: [paidRow] } })
    const commissionCell = cells('b', wrapper)[4]
    expect(commissionCell.text()).toContain('-')
    expect(commissionCell.classes()).toContain('text-danger')
  })

  it('colore le net en success seulement quand il est positif', () => {
    const wrapper = mount(TransactionTable, { props: { transactions: [zeroRow, paidRow] } })
    expect(cells('a', wrapper)[5].classes()).toContain('text-text-muted') // net 0
    expect(cells('b', wrapper)[5].classes()).toContain('text-success')    // net > 0
  })

  it('formate une ligne XOF en unité pleine et en F CFA, jamais en euros', () => {
    // 5000 F CFA en unités mineures = 5000 (le XOF n'a pas de sous-unité) :
    // l'ancien formatEuros divisait par 100 et affichait « 50,00 € ».
    const xofRow: TransactionRow = {
      tripId: 'c',
      corridor: 'Dakar → Paris',
      departureDate: '2026-07-02',
      parcelCount: 1,
      grossRevenue: 5000,
      commission: 0,
      netRevenue: 5000,
      currency: 'XOF',
    }
    const wrapper = mount(TransactionTable, { props: { transactions: [xofRow] } })
    const gross = cells('c', wrapper)[3].text()
    expect(gross).not.toContain('€')
    expect(gross.replace(/[^0-9]/g, '')).toBe('5000')
  })

  it('replie sur l\'euro quand le backend n\'envoie pas encore la devise', () => {
    const wrapper = mount(TransactionTable, { props: { transactions: [paidRow] } })
    expect(cells('b', wrapper)[3].text()).toContain('€')
    expect(cells('b', wrapper)[3].text()).toContain('100,00')
  })

  it('affiche un état vide sans transaction', () => {
    const wrapper = mount(TransactionTable, { props: { transactions: [] } })
    expect(wrapper.text()).toContain('Aucune transaction')
  })
})
