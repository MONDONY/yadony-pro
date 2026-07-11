// tests/unit/features/profil-public/SubscribersCard.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SubscribersCard from '@/features/profil-public/components/SubscribersCard.vue'

const subscribers = [
  { senderId: 'u1', displayName: 'Alice Ba', subscribedAt: '2026-06-10T08:00:00' },
  { senderId: 'u2', displayName: 'Bob Koné', subscribedAt: '2026-07-01T09:30:00' },
]

describe('SubscribersCard', () => {
  it('affiche le nombre et la liste des abonnés', () => {
    const wrapper = mount(SubscribersCard, { props: { subscribers, isLoading: false } })
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('Alice Ba')
    expect(wrapper.text()).toContain('Bob Koné')
  })

  it('affiche un état vide sans abonnés', () => {
    const wrapper = mount(SubscribersCard, { props: { subscribers: [], isLoading: false } })
    expect(wrapper.find('[data-test="subscribers-empty"]').exists()).toBe(true)
  })

  it('affiche un squelette pendant le chargement', () => {
    const wrapper = mount(SubscribersCard, { props: { subscribers: [], isLoading: true } })
    expect(wrapper.find('[data-test="subscribers-loading"]').exists()).toBe(true)
  })
})
