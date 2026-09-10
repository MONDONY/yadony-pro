// tests/unit/features/colis/BidMoney.spec.ts
// Les revenus d'un colis s'affichent dans la devise du bid, plus en « € » figé,
// et la « valeur déclarée » (que le backend ne sert plus) a disparu du panneau.
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BidTableRow from '@/features/colis/components/BidTableRow.vue'
import BidDetailPanel from '@/features/colis/components/BidDetailPanel.vue'
import type { Bid } from '@/features/colis/types/index'

const compact = (t: string) => t.replace(/[\s  ]/g, '')

const bid: Bid = {
  id: 'bid-xof',
  status: 'ACCEPTED' as Bid['status'],
  tripId: 'trip-1',
  tripCorridor: 'Bamako → Abidjan',
  tripDepartureDate: '2026-06-10',
  sender: { id: 's1', name: 'Fatou Diop', avatarInitials: 'FD', rating: 4.5, totalSentParcels: 3 },
  weightKg: 3,
  contentDescription: 'Vêtements',
  currency: 'XOF',
  earningsEuros: 13200,
  paymentStatus: 'ESCROWED',
  paymentAmountEuros: 15000,
  history: [],
  createdAt: '2026-06-01T10:00:00Z',
  expiresAt: null,
  trackingNumber: 'DON-XOF',
  trackingToken: null,
}

describe('BidTableRow', () => {
  it('affiche les revenus dans la devise du bid', () => {
    const wrapper = mount(BidTableRow, { props: { bid, isSelected: false } })
    expect(compact(wrapper.text())).toContain('13200FCFA')
    expect(wrapper.text()).not.toContain('€')
  })

  it('affiche un tiret sans revenus connus', () => {
    const wrapper = mount(BidTableRow, { props: { bid: { ...bid, earningsEuros: null }, isSelected: false } })
    expect(wrapper.text()).toContain('—')
  })
})

describe('BidDetailPanel', () => {
  it('affiche brut et net dans la devise du bid, sans valeur déclarée', () => {
    const wrapper = mount(BidDetailPanel, {
      props: { bid, isOpen: true },
      global: { stubs: { Teleport: true } },
    })
    const text = compact(wrapper.text())
    expect(text).toContain('15000FCFA')
    expect(text).toContain('13200FCFA')
    expect(wrapper.text()).not.toContain('Valeur déclarée')
    expect(wrapper.text()).not.toContain('NaN')
  })

  it('formate en euros un bid sans devise explicite', () => {
    const wrapper = mount(BidDetailPanel, {
      props: { bid: { ...bid, currency: 'EUR', earningsEuros: 52.8, paymentAmountEuros: 60 }, isOpen: true },
      global: { stubs: { Teleport: true } },
    })
    const text = compact(wrapper.text())
    expect(text).toContain('60,00€')
    expect(text).toContain('52,80€')
  })
})

describe('BidTableRow — gestes', () => {
  it('émet les gestes de sélection, détail, acceptation et refus', async () => {
    const escrowed = { ...bid, status: 'PAYMENT_ESCROWED' as Bid['status'] }
    const wrapper = mount(BidTableRow, { props: { bid: escrowed, isSelected: true } })
    await wrapper.find('[data-test="row-checkbox-bid-xof"]').trigger('change')
    expect(wrapper.emitted('toggle-select')?.[0]).toEqual(['bid-xof'])
    await wrapper.find('[data-test="btn-detail-bid-xof"]').trigger('click')
    expect(wrapper.emitted('open-detail')?.[0]).toEqual([escrowed])
    await wrapper.find('[data-test="btn-accept-bid-xof"]').trigger('click')
    expect(wrapper.emitted('accept')?.[0]).toEqual(['bid-xof'])
    await wrapper.find('[data-test="btn-reject-bid-xof"]').trigger('click')
    expect(wrapper.emitted('reject')?.[0]).toEqual(['bid-xof'])
  })

  it('copie le numéro de suivi et affiche la date de départ', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const wrapper = mount(BidTableRow, { props: { bid, isSelected: false } })
    await wrapper.find('button[title="Copier DON-XOF"]').trigger('click')
    expect(writeText).toHaveBeenCalledWith('DON-XOF')
    expect(wrapper.text()).toContain('2026')
  })

  it('affiche un tiret sans numéro de suivi', () => {
    const wrapper = mount(BidTableRow, { props: { bid: { ...bid, trackingNumber: null }, isSelected: false } })
    expect(wrapper.text()).toContain('—')
  })
})

describe('BidDetailPanel — gestes', () => {
  const escrowed: Bid = {
    ...bid,
    status: 'PAYMENT_ESCROWED' as Bid['status'],
    history: [
      { date: '2026-06-01T10:00:00Z', status: 'PENDING' as Bid['status'], note: 'Créé' },
      { date: '2026-06-02T10:00:00Z', status: 'PAYMENT_ESCROWED' as Bid['status'], note: null },
    ],
  }

  it('émet fermeture, acceptation et refus, et trie l’historique du plus récent au plus ancien', async () => {
    const wrapper = mount(BidDetailPanel, { props: { bid: escrowed, isOpen: true }, global: { stubs: { Teleport: true } } })
    await wrapper.find('[data-test="panel-close"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    await wrapper.find('[data-test="panel-backdrop"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(2)
    await wrapper.find('[data-test="panel-btn-accept"]').trigger('click')
    expect(wrapper.emitted('accept')?.[0]).toEqual(['bid-xof'])
    await wrapper.find('[data-test="panel-btn-reject"]').trigger('click')
    expect(wrapper.emitted('reject')?.[0]).toEqual(['bid-xof'])
    const text = wrapper.text()
    expect(text.indexOf('Créé')).toBeGreaterThan(-1)
    expect(text).toContain('2 juin')
  })

  it('copie le numéro de suivi depuis le panneau', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const wrapper = mount(BidDetailPanel, { props: { bid: escrowed, isOpen: true }, global: { stubs: { Teleport: true } } })
    await wrapper.find('button[title="Copier le numéro"]').trigger('click')
    expect(writeText).toHaveBeenCalledWith('DON-XOF')
  })

  it('ne rend rien sans bid', () => {
    const wrapper = mount(BidDetailPanel, { props: { bid: null, isOpen: false }, global: { stubs: { Teleport: true } } })
    expect(wrapper.find('[data-test="bid-detail-panel"]').exists()).toBe(false)
  })
})
