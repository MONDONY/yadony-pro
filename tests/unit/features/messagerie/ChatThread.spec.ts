import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatThread from '@/features/messagerie/components/ChatThread.vue'
import type { ChatMessage } from '@/features/messagerie/types/index'

const msgs: ChatMessage[] = [
  { id: 'a', senderId: 'me', body: 'Salut', imageUrl: null, type: 'TEXT', sentAt: '2026-05-27T10:00:00.000Z', readAt: null },
  { id: 'b', senderId: 'other', body: 'Bonjour', imageUrl: null, type: 'TEXT', sentAt: '2026-05-27T10:01:00.000Z', readAt: null },
]

function mountThread(props: Record<string, unknown> = {}) {
  return mount(ChatThread, {
    props: { messages: msgs, currentUid: 'me', readOnly: false, isSending: false, ...props },
  })
}

describe('ChatThread', () => {
  it('renders messages and aligns mine to the right, others to the left', () => {
    const wrapper = mountThread()
    expect(wrapper.find('[data-test="msg-a"]').classes()).toContain('justify-end')
    expect(wrapper.find('[data-test="msg-b"]').classes()).toContain('justify-start')
    expect(wrapper.text()).toContain('Salut')
    expect(wrapper.text()).toContain('Bonjour')
  })

  it('shows an empty state when there are no messages', () => {
    const wrapper = mountThread({ messages: [] })
    expect(wrapper.find('[data-test="chat-empty"]').exists()).toBe(true)
  })

  it('emits send with the trimmed body and clears the input', async () => {
    const wrapper = mountThread()
    const input = wrapper.find('[data-test="chat-input"]')
    await input.setValue('  Coucou  ')
    await wrapper.find('[data-test="chat-form"]').trigger('submit')
    expect(wrapper.emitted('send')![0][0]).toBe('Coucou')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('does not emit send when the draft is empty', async () => {
    const wrapper = mountThread()
    await wrapper.find('[data-test="chat-form"]').trigger('submit')
    expect(wrapper.emitted('send')).toBeFalsy()
  })

  it('hides the input and shows a notice when read-only', () => {
    const wrapper = mountThread({ readOnly: true })
    expect(wrapper.find('[data-test="chat-form"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="chat-readonly"]').exists()).toBe(true)
  })
})
