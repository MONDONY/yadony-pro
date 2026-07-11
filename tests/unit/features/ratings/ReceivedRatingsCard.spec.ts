// tests/unit/features/ratings/ReceivedRatingsCard.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReceivedRatingsCard from '@/features/ratings/components/ReceivedRatingsCard.vue'

const summary = {
  averageRating: 4.6,
  ratingCount: 12,
  distribution: { 5: 8, 4: 3, 3: 1 },
  ratings: [
    {
      stars: 5, comment: 'Voyageur très sérieux', createdAt: '2026-07-01T10:00:00',
      excluded: false, authorName: 'Alice', authorAvatarUrl: null,
      departureCity: 'Paris', arrivalCity: 'Dakar',
    },
    {
      stars: 3, comment: null, createdAt: '2026-06-20T10:00:00',
      excluded: false, authorName: null, authorAvatarUrl: null,
      departureCity: null, arrivalCity: null,
    },
  ],
  page: 0,
  totalPages: 1,
}

describe('ReceivedRatingsCard', () => {
  it('affiche la moyenne et le nombre de notes', () => {
    const wrapper = mount(ReceivedRatingsCard, { props: { summary, isLoading: false } })
    expect(wrapper.text()).toContain('4.6')
    expect(wrapper.text()).toContain('12')
  })

  it('liste les commentaires avec auteur et corridor', () => {
    const wrapper = mount(ReceivedRatingsCard, { props: { summary, isLoading: false } })
    expect(wrapper.text()).toContain('Voyageur très sérieux')
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Paris → Dakar')
  })

  it('affiche un état vide quand aucune note', () => {
    const wrapper = mount(ReceivedRatingsCard, {
      props: { summary: { ...summary, ratingCount: 0, ratings: [] }, isLoading: false },
    })
    expect(wrapper.find('[data-test="ratings-empty"]').exists()).toBe(true)
  })

  it('affiche un squelette pendant le chargement', () => {
    const wrapper = mount(ReceivedRatingsCard, { props: { summary: null, isLoading: true } })
    expect(wrapper.find('[data-test="ratings-loading"]').exists()).toBe(true)
  })
})
