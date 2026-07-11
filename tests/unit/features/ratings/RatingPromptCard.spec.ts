// tests/unit/features/ratings/RatingPromptCard.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RatingPromptCard from '@/features/ratings/components/RatingPromptCard.vue'

const pending = {
  bidId: 'b1',
  otherPartyName: 'Alice Ba',
  otherPartyId: 'u2',
  deliveredAt: '2026-07-10T10:00:00',
  isTravelerRating: true,
}

describe('RatingPromptCard', () => {
  it('affiche le nom de l’expéditeur à noter', () => {
    const wrapper = mount(RatingPromptCard, { props: { pending, isSubmitting: false } })
    expect(wrapper.text()).toContain('Alice Ba')
  })

  it('le bouton envoyer est désactivé sans étoiles choisies', () => {
    const wrapper = mount(RatingPromptCard, { props: { pending, isSubmitting: false } })
    expect(wrapper.find('[data-test="rating-submit"]').attributes('disabled')).toBeDefined()
  })

  it('choisir 4 étoiles puis envoyer émet submit avec bidId, stars et commentaire', async () => {
    const wrapper = mount(RatingPromptCard, { props: { pending, isSubmitting: false } })
    await wrapper.find('[data-test="rating-star-4"]').trigger('click')
    await wrapper.find('[data-test="rating-comment"]').setValue('Très ponctuelle')
    await wrapper.find('[data-test="rating-submit"]').trigger('click')
    expect(wrapper.emitted('submit')?.[0]).toEqual(['b1', 4, 'Très ponctuelle'])
  })

  it('désactive le bouton pendant l’envoi', async () => {
    const wrapper = mount(RatingPromptCard, { props: { pending, isSubmitting: true } })
    await wrapper.find('[data-test="rating-star-5"]').trigger('click')
    expect(wrapper.find('[data-test="rating-submit"]').attributes('disabled')).toBeDefined()
  })
})
