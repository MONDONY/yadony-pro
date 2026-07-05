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

  it('affiche un état vide sans transaction', () => {
    const wrapper = mount(TransactionTable, { props: { transactions: [] } })
    expect(wrapper.text()).toContain('Aucune transaction')
  })
})
