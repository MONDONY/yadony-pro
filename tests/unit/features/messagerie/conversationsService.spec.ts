import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

async function importService() {
  const mod = await import('@/features/messagerie/services/conversationsService')
  return mod.conversationsService
}

describe('conversationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('list calls GET /conversations with page/size query', async () => {
    mockApiFn.mockResolvedValue({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, last: true })
    const svc = (await importService())()
    await svc.list(2, 20)
    expect(mockApiFn).toHaveBeenCalledWith('/conversations', { query: { page: 2, size: 20 } })
  })

  it('archive POSTs /conversations/{id}/archive', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const svc = (await importService())()
    await svc.archive('c1')
    expect(mockApiFn).toHaveBeenCalledWith('/conversations/c1/archive', { method: 'POST' })
  })

  it('unarchive POSTs /conversations/{id}/unarchive', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const svc = (await importService())()
    await svc.unarchive('c1')
    expect(mockApiFn).toHaveBeenCalledWith('/conversations/c1/unarchive', { method: 'POST' })
  })
})
