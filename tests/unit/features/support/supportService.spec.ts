import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApi = vi.fn()
vi.mock('@/composables/useApi', () => ({ useApi: () => mockApi }))

describe('supportService', () => {
  beforeEach(() => {
    vi.resetModules()
    mockApi.mockReset()
    mockApi.mockResolvedValue({})
  })

  async function svc() {
    const { supportService } = await import('@/features/support/services/supportService')
    return supportService()
  }

  it('liste les demandes avec pagination', async () => {
    await (await svc()).listTickets(1, 10)
    expect(mockApi).toHaveBeenCalledWith('/support/tickets', { query: { page: 1, size: 10 } })
  })

  it('lit, crée et répond à une demande', async () => {
    const s = await svc()
    await s.getTicket('t1')
    await s.createTicket({ category: 'PAYMENT', subject: 'Versement', message: 'Bonjour' })
    await s.reply('t1', 'Merci')
    await s.markRead('t1')
    expect(mockApi).toHaveBeenCalledWith('/support/tickets/t1')
    expect(mockApi).toHaveBeenCalledWith('/support/tickets', { method: 'POST', body: { category: 'PAYMENT', subject: 'Versement', message: 'Bonjour' } })
    expect(mockApi).toHaveBeenCalledWith('/support/tickets/t1/messages', { method: 'POST', body: { content: 'Merci' } })
    expect(mockApi).toHaveBeenCalledWith('/support/tickets/t1/read', { method: 'POST' })
  })

  it('charge les questions fréquentes et le nombre de non-lus', async () => {
    mockApi.mockResolvedValueOnce([{ code: 'a' }]).mockResolvedValueOnce({ count: 4 })
    const s = await svc()
    await expect(s.listReplies()).resolves.toEqual([{ code: 'a' }])
    await expect(s.unreadCount()).resolves.toBe(4)
    expect(mockApi).toHaveBeenCalledWith('/support/replies')
    expect(mockApi).toHaveBeenCalledWith('/support/unread-count')
  })
})
