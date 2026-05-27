import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NotificationItem from '@/features/notifications/components/NotificationItem.vue'

const unread = {
  id: 'n1', type: 'BID', title: 'Nouveau bid', body: 'Alice propose 30 €',
  data: {}, read: false, createdAt: '2026-05-27T10:00:00',
}

describe('NotificationItem', () => {
  it('renders the title and body', () => {
    const wrapper = mount(NotificationItem, { props: { notification: unread } })
    expect(wrapper.text()).toContain('Nouveau bid')
    expect(wrapper.text()).toContain('Alice propose 30 €')
  })

  it('shows the read button and emits read for an unread notification', async () => {
    const wrapper = mount(NotificationItem, { props: { notification: unread } })
    const btn = wrapper.find('[data-test="notif-read-n1"]')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(wrapper.emitted('read')![0][0]).toBe('n1')
  })

  it('hides the read button for an already-read notification', () => {
    const wrapper = mount(NotificationItem, { props: { notification: { ...unread, read: true } } })
    expect(wrapper.find('[data-test="notif-read-n1"]').exists()).toBe(false)
  })

  it('emits remove when the delete button is clicked', async () => {
    const wrapper = mount(NotificationItem, { props: { notification: unread } })
    await wrapper.find('[data-test="notif-remove-n1"]').trigger('click')
    expect(wrapper.emitted('remove')![0][0]).toBe('n1')
  })
})
