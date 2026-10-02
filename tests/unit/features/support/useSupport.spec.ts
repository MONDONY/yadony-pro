import { describe, it, expect, vi, beforeEach } from 'vitest'

const svc = {
  listTickets: vi.fn(),
  getTicket: vi.fn(),
  createTicket: vi.fn(),
  reply: vi.fn(),
  markRead: vi.fn(),
  listReplies: vi.fn(),
}
vi.mock('@/features/support/services/supportService', () => ({ supportService: () => svc }))

const ticket = (over = {}) => ({
  id: 't1', category: 'PAYMENT', subject: 'Versement', status: 'WAITING_USER',
  createdAt: '2026-10-01T10:00:00', lastMessageAt: '2026-10-01T11:00:00', resolvedAt: null,
  unreadCount: 0, messages: [], ...over,
})

describe('useSupportTickets', () => {
  beforeEach(() => {
    vi.resetModules()
    Object.values(svc).forEach((f) => f.mockReset())
  })

  async function load() {
    const { useSupportTickets } = await import('@/features/support/composables/useSupportTickets')
    return useSupportTickets()
  }

  it('charge les demandes et les questions fréquentes', async () => {
    svc.listTickets.mockResolvedValue({ content: [ticket()], totalElements: 1, totalPages: 1, number: 0, size: 20 })
    svc.listReplies.mockResolvedValue([{ code: 'q1', category: 'ACCOUNT', question: 'Q ?', answer: 'R' }])
    const s = await load()
    await Promise.all([s.fetchTickets(), s.fetchFaq()])
    expect(s.tickets.value).toHaveLength(1)
    expect(s.faq.value[0]?.code).toBe('q1')
  })

  it('signale l\'échec du chargement, et ignore celui des questions fréquentes', async () => {
    svc.listTickets.mockRejectedValue(new Error('500'))
    svc.listReplies.mockRejectedValue(new Error('500'))
    const s = await load()
    await s.fetchTickets()
    await s.fetchFaq()
    expect(s.error.value).toMatch(/Impossible de charger/)
    expect(s.faq.value).toEqual([])
  })

  it('crée une demande nettoyée et l\'ajoute en tête de liste', async () => {
    svc.createTicket.mockResolvedValue(ticket({ id: 'new' }))
    const s = await load()
    s.tickets.value = [ticket() as never]
    await expect(s.createTicket({ category: 'OTHER', subject: '  Aide  ', message: ' Bonjour ' })).resolves.toBe('new')
    expect(svc.createTicket).toHaveBeenCalledWith({ category: 'OTHER', subject: 'Aide', message: 'Bonjour' })
    expect(s.tickets.value.map((t) => t.id)).toEqual(['new', 't1'])
  })

  it('affiche le motif du serveur quand la création échoue', async () => {
    svc.createTicket.mockRejectedValue({ data: { detail: 'Message trop long.' } })
    const s = await load()
    await expect(s.createTicket({ category: 'OTHER', subject: 'a', message: 'b' })).resolves.toBeNull()
    expect(s.createError.value).toBe('Message trop long.')
    expect(s.isCreating.value).toBe(false)
  })
})

describe('useSupportTicket', () => {
  beforeEach(() => {
    vi.resetModules()
    Object.values(svc).forEach((f) => f.mockReset())
  })

  async function load() {
    const { useSupportTicket } = await import('@/features/support/composables/useSupportTicket')
    return useSupportTicket('t1')
  }

  it('charge le fil et marque la demande lue quand il y a des non-lus', async () => {
    svc.getTicket.mockResolvedValue(ticket({ unreadCount: 2 }))
    svc.markRead.mockResolvedValue(undefined)
    const s = await load()
    await s.fetchTicket()
    await Promise.resolve()
    expect(svc.markRead).toHaveBeenCalledWith('t1')
    await vi.waitFor(() => expect(s.ticket.value?.unreadCount).toBe(0))
  })

  it('ne marque pas lu sans message non lu, et supporte l\'échec du marquage', async () => {
    svc.getTicket.mockResolvedValue(ticket())
    const s = await load()
    await s.fetchTicket()
    expect(svc.markRead).not.toHaveBeenCalled()

    svc.getTicket.mockResolvedValue(ticket({ unreadCount: 1 }))
    svc.markRead.mockRejectedValue(new Error('500'))
    await s.fetchTicket()
    expect(s.ticket.value).not.toBeNull()
    expect(s.error.value).toBeNull()
  })

  it('signale une demande introuvable', async () => {
    svc.getTicket.mockRejectedValue({ status: 404 })
    const s = await load()
    await s.fetchTicket()
    expect(s.error.value).toMatch(/Impossible de charger/)
  })

  it('ajoute la réponse au fil et passe en attente du support', async () => {
    svc.getTicket.mockResolvedValue(ticket())
    svc.reply.mockResolvedValue({ id: 'm9', authorType: 'USER', content: 'Merci', createdAt: '2026-10-02T10:00:00', attachments: [] })
    const s = await load()
    await s.fetchTicket()
    await expect(s.send('  Merci  ')).resolves.toBe(true)
    expect(svc.reply).toHaveBeenCalledWith('t1', 'Merci')
    expect(s.ticket.value?.messages?.map((m) => m.id)).toEqual(['m9'])
    expect(s.ticket.value?.status).toBe('WAITING_SUPPORT')
  })

  it('refuse d\'envoyer un message vide ou sur une demande résolue', async () => {
    svc.getTicket.mockResolvedValue(ticket({ status: 'RESOLVED' }))
    const s = await load()
    await s.fetchTicket()
    await expect(s.send('Bonjour')).resolves.toBe(false)
    svc.getTicket.mockResolvedValue(ticket())
    await s.fetchTicket()
    await expect(s.send('   ')).resolves.toBe(false)
    expect(svc.reply).not.toHaveBeenCalled()
  })

  it('affiche le motif du serveur quand la réponse est refusée', async () => {
    svc.getTicket.mockResolvedValue(ticket())
    svc.reply.mockRejectedValue({ data: { detail: 'Ce ticket est résolu.' } })
    const s = await load()
    await s.fetchTicket()
    await expect(s.send('Bonjour')).resolves.toBe(false)
    expect(s.sendError.value).toBe('Ce ticket est résolu.')
    expect(s.isSending.value).toBe(false)
  })
})
