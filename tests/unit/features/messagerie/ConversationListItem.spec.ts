import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConversationListItem from '@/features/messagerie/components/ConversationListItem.vue'

const base = {
  id: 'c1',
  bidId: 'b',
  firestoreConversationId: 'f',
  otherParticipant: { id: 'u', name: 'Alice Martin', avatarUrl: null },
  lastMessagePreview: 'On se voit demain ?',
  lastMessageAt: '2026-05-27T10:00:00',
  hasUnread: true,
  tripOrigin: 'Paris',
  tripDestination: 'Dakar',
  tripDate: '2026-06-01',
  tripWeightKg: 5,
  bidStatus: 'ACCEPTED',
  readOnly: false,
  deletedBySelf: false,
}

describe('ConversationListItem', () => {
  it('renders participant, corridor and last message preview', () => {
    const wrapper = mount(ConversationListItem, { props: { conversation: base } })
    expect(wrapper.text()).toContain('Alice Martin')
    expect(wrapper.text()).toContain('Paris → Dakar')
    expect(wrapper.text()).toContain('On se voit demain ?')
  })

  it('shows the unread dot when hasUnread is true', () => {
    const wrapper = mount(ConversationListItem, { props: { conversation: base } })
    expect(wrapper.find('[data-test="conv-unread"]').exists()).toBe(true)
  })

  it('shows a read-only notice when the conversation is read-only', () => {
    const wrapper = mount(ConversationListItem, { props: { conversation: { ...base, readOnly: true } } })
    expect(wrapper.find('[data-test="conv-readonly"]').exists()).toBe(true)
  })

  it('emits archive when the archive button is clicked', async () => {
    const wrapper = mount(ConversationListItem, { props: { conversation: base } })
    await wrapper.find('[data-test="conv-archive-c1"]').trigger('click')
    expect(wrapper.emitted('archive')![0][0]).toBe('c1')
  })
})
