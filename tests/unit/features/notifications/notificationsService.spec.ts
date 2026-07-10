import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

async function importService() {
  const mod = await import('@/features/notifications/services/notificationsService')
  return mod.notificationsService
}

describe('notificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('list calls GET /notifications with page/size query', async () => {
    mockApiFn.mockResolvedValue({ content: [], page: 0, size: 30, totalElements: 0, totalPages: 0, last: true })
    const svc = (await importService())()
    await svc.list(1, 10)
    expect(mockApiFn).toHaveBeenCalledWith('/notifications', { query: { page: 1, size: 10 } })
  })

  it('unreadCount returns the count field', async () => {
    mockApiFn.mockResolvedValue({ count: 4 })
    const svc = (await importService())()
    expect(await svc.unreadCount()).toBe(4)
    expect(mockApiFn).toHaveBeenCalledWith('/notifications/unread-count')
  })

  it('markRead PATCHes /notifications/{id}/read', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const svc = (await importService())()
    await svc.markRead('n1')
    expect(mockApiFn).toHaveBeenCalledWith('/notifications/n1/read', { method: 'PATCH' })
  })

  it('markAllRead PATCHes /notifications/read-all', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const svc = (await importService())()
    await svc.markAllRead()
    expect(mockApiFn).toHaveBeenCalledWith('/notifications/read-all', { method: 'PATCH' })
  })

  it('remove DELETEs /notifications/{id}', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const svc = (await importService())()
    await svc.remove('n1')
    expect(mockApiFn).toHaveBeenCalledWith('/notifications/n1', { method: 'DELETE' })
  })
})
