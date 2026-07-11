// tests/unit/features/demandes/MatchingRequestCard.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MatchingRequestCard from '@/features/demandes/components/MatchingRequestCard.vue'
import type { MatchingRequest } from '@/features/demandes/types/index'

function request(over: Partial<MatchingRequest> = {}): MatchingRequest {
  return {
    id: 'pr-1',
    tripId: 't1',
    tripCorridor: 'Paris → Dakar',
    tripDepartureDate: '2026-08-01',
    tripAvailableKg: 10,
    senderId: 's1',
    senderName: 'Alice Ba',
    senderInitials: 'AB',
    senderAvatarUrl: null,
    senderRating: 4,
    senderTotalSent: 3,
    weightKg: 5,
    contentType: 'Vêtements',
    budgetPerKg: 8,
    packagePhotoUrl: null,
    messageExcerpt: '',
    matchScore: 90,
    requestedAt: '2026-07-01T10:00:00',
    ...over,
  }
}

function mountCard(over: Partial<MatchingRequest> = {}, isFavorite = false) {
  return mount(MatchingRequestCard, {
    props: { request: request(over), isNegotiating: false, hasNegotiated: false, isFavorite },
  })
}

describe('MatchingRequestCard — favoris', () => {
  it('affiche une étoile non remplie quand la demande n’est pas favorite', () => {
    const wrapper = mountCard()
    const btn = wrapper.find('[data-test="favorite-btn-pr-1"]')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-pressed')).toBe('false')
  })

  it('affiche une étoile remplie quand la demande est favorite', () => {
    const wrapper = mountCard({}, true)
    expect(wrapper.find('[data-test="favorite-btn-pr-1"]').attributes('aria-pressed')).toBe('true')
  })

  it('émet toggle-favorite au clic sans déclencher view-detail', async () => {
    const wrapper = mountCard()
    await wrapper.find('[data-test="favorite-btn-pr-1"]').trigger('click')
    expect(wrapper.emitted('toggle-favorite')?.[0]).toEqual(['pr-1'])
    expect(wrapper.emitted('view-detail')).toBeUndefined()
  })
})
