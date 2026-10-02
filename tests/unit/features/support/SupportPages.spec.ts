import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const svc = {
  listTickets: vi.fn(),
  getTicket: vi.fn(),
  createTicket: vi.fn(),
  reply: vi.fn(),
  markRead: vi.fn(),
  listReplies: vi.fn(),
}
vi.mock('@/features/support/services/supportService', () => ({ supportService: () => svc }))

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

const NuxtLink = { props: ['to'], template: '<a :href="to"><slot /></a>' }

beforeEach(() => {
  vi.resetModules()
  Object.values(svc).forEach((f) => f.mockReset())
  push.mockReset()
  vi.stubGlobal('definePageMeta', () => {})
  vi.stubGlobal('useRoute', () => ({ params: { id: 't1' } }))
})

const ticket = (over = {}) => ({
  id: 't1', category: 'PAYMENT', subject: 'Versement bloqué', status: 'WAITING_USER',
  createdAt: '2026-10-01T10:00:00', lastMessageAt: '2026-10-01T11:00:00', resolvedAt: null, unreadCount: 0,
  lastMessagePreview: 'On regarde', lastMessageFromAdmin: true, messages: [], ...over,
})

describe('page /support', () => {
  async function mountPage() {
    const { default: Page } = await import('../../../../app/pages/support/index.vue')
    const w = mount(Page, { global: { stubs: { NuxtLink } } })
    await flushPromises()
    return w
  }

  it('liste les demandes avec le badge de messages non lus', async () => {
    svc.listTickets.mockResolvedValue({ content: [ticket({ unreadCount: 2 })], totalElements: 1, totalPages: 1, number: 0, size: 20 })
    svc.listReplies.mockResolvedValue([])
    const w = await mountPage()
    expect(w.find('[data-test="ticket-t1"]').text()).toContain('Versement bloqué')
    expect(w.find('[data-test="ticket-t1"]').text()).toContain('Équipe yadony : On regarde')
    expect(w.find('[data-test="ticket-unread-t1"]').text()).toBe('2')
    expect(w.find('[data-test="support-faq"]').exists()).toBe(false)
  })

  it('montre l\'état vide et déplie une question fréquente', async () => {
    svc.listTickets.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 })
    svc.listReplies.mockResolvedValue([{ code: 'kyc', category: 'KYC', question: 'Comment vérifier mon identité ?', answer: 'Depuis Paramètres.' }])
    const w = await mountPage()
    expect(w.find('[data-test="support-empty"]').exists()).toBe(true)
    expect(w.find('[data-test="faq-answer-kyc"]').exists()).toBe(false)
    await w.find('[data-test="faq-kyc"]').trigger('click')
    expect(w.find('[data-test="faq-answer-kyc"]').text()).toBe('Depuis Paramètres.')
  })

  it('crée une demande puis ouvre son fil', async () => {
    svc.listTickets.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 })
    svc.listReplies.mockResolvedValue([])
    svc.createTicket.mockResolvedValue(ticket({ id: 'new' }))
    const w = await mountPage()
    await w.find('[data-test="support-new"]').trigger('click')
    expect((w.find('[data-test="support-submit"]').element as HTMLButtonElement).disabled).toBe(true)
    await w.find('[data-test="support-category"]').setValue('PAYMENT')
    await w.find('[data-test="support-subject"]').setValue('Versement')
    await w.find('[data-test="support-message"]').setValue('Il manque 20 €')
    await w.find('[data-test="support-form"]').trigger('submit')
    await flushPromises()
    expect(svc.createTicket).toHaveBeenCalledWith({ category: 'PAYMENT', subject: 'Versement', message: 'Il manque 20 €' })
    expect(push).toHaveBeenCalledWith('/support/new')
  })

  it('affiche l\'erreur de chargement', async () => {
    svc.listTickets.mockRejectedValue(new Error('500'))
    svc.listReplies.mockResolvedValue([])
    const w = await mountPage()
    expect(w.find('[data-test="support-error"]').exists()).toBe(true)
  })
})

describe('page /support/[id]', () => {
  async function mountPage() {
    const { default: Page } = await import('../../../../app/pages/support/[id].vue')
    const w = mount(Page, { global: { stubs: { NuxtLink } } })
    await flushPromises()
    return w
  }

  const thread = [
    { id: 'm1', authorType: 'USER', content: 'Bonjour', createdAt: '2026-10-01T10:00:00', attachments: [] },
    { id: 'm2', authorType: 'ADMIN', content: 'On regarde', createdAt: '2026-10-01T11:00:00', attachments: [] },
  ]

  it('affiche le fil et envoie une réponse', async () => {
    svc.getTicket.mockResolvedValue(ticket({ messages: thread }))
    svc.reply.mockResolvedValue({ id: 'm3', authorType: 'USER', content: 'Merci', createdAt: '2026-10-02T10:00:00', attachments: [] })
    const w = await mountPage()
    expect(w.find('[data-test="ticket-subject"]').text()).toBe('Versement bloqué')
    expect(w.find('[data-test="msg-admin"]').text()).toContain('Équipe yadony')
    await w.find('[data-test="ticket-reply-input"]').setValue('Merci')
    await w.find('[data-test="ticket-reply"]').trigger('submit')
    await flushPromises()
    expect(svc.reply).toHaveBeenCalledWith('t1', 'Merci')
    expect(w.findAll('[data-test="msg-user"]')).toHaveLength(2)
    expect((w.find('[data-test="ticket-reply-input"]').element as HTMLTextAreaElement).value).toBe('')
  })

  it('masque le champ de réponse quand la demande est résolue', async () => {
    svc.getTicket.mockResolvedValue(ticket({ status: 'RESOLVED', messages: thread }))
    const w = await mountPage()
    expect(w.find('[data-test="ticket-reply"]').exists()).toBe(false)
    expect(w.find('[data-test="ticket-resolved"]').exists()).toBe(true)
  })

  it('montre une erreur quand la demande est introuvable', async () => {
    svc.getTicket.mockRejectedValue({ status: 404 })
    const w = await mountPage()
    expect(w.find('[data-test="ticket-error"]').exists()).toBe(true)
  })
})
