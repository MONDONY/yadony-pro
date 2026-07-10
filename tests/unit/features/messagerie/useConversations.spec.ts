import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockList = vi.fn()
const mockArchive = vi.fn()
const mockUnarchive = vi.fn()

vi.mock('@/features/messagerie/services/conversationsService', () => ({
  conversationsService: () => ({ list: mockList, archive: mockArchive, unarchive: mockUnarchive }),
}))

async function importComposable() {
  const mod = await import('@/features/messagerie/composables/useConversations')
  return mod.useConversations
}

function conv(id: string) {
  return {
    id,
    bidId: 'b',
    firestoreConversationId: 'f',
    otherParticipant: { id: 'u', name: 'Alice', avatarUrl: null },
    lastMessagePreview: 'Salut',
    lastMessageAt: '2026-05-27T10:00:00',
    hasUnread: false,
    tripOrigin: 'Paris',
    tripDestination: 'Dakar',
    tripDate: '2026-06-01',
    tripWeightKg: 5,
    bidStatus: 'ACCEPTED',
    readOnly: false,
    deletedBySelf: false,
  }
}

function pageOf(content: ReturnType<typeof conv>[], last = true, page = 0) {
  return { content, page, size: 20, totalElements: content.length, totalPages: 1, last }
}

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchFirstPage loads conversations', async () => {
    mockList.mockResolvedValue(pageOf([conv('a'), conv('b')], false))
    const { conversations, last, fetchFirstPage } = (await importComposable())()
    await fetchFirstPage()
    expect(conversations.value).toHaveLength(2)
    expect(last.value).toBe(false)
  })

  it('sets an error when fetchFirstPage rejects', async () => {
    mockList.mockRejectedValue(new Error('x'))
    const { error, fetchFirstPage } = (await importComposable())()
    await fetchFirstPage()
    expect(error.value).toBe('Impossible de charger tes conversations.')
  })

  it('loadMore appends and respects the last flag', async () => {
    mockList.mockResolvedValueOnce(pageOf([conv('a')], false, 0))
    const { conversations, fetchFirstPage, loadMore } = (await importComposable())()
    await fetchFirstPage()
    mockList.mockResolvedValueOnce(pageOf([conv('b')], true, 1))
    await loadMore()
    expect(conversations.value.map((c) => c.id)).toEqual(['a', 'b'])
    await loadMore()
    expect(mockList).toHaveBeenCalledTimes(2)
  })

  it('archive removes the conversation from the active list', async () => {
    mockList.mockResolvedValue(pageOf([conv('a'), conv('b')]))
    mockArchive.mockResolvedValue(undefined)
    const { conversations, fetchFirstPage, archive } = (await importComposable())()
    await fetchFirstPage()
    await archive('a')
    expect(conversations.value.map((c) => c.id)).toEqual(['b'])
  })

  it('sets an error when archive rejects', async () => {
    mockList.mockResolvedValue(pageOf([conv('a')]))
    mockArchive.mockRejectedValue(new Error('x'))
    const { error, fetchFirstPage, archive } = (await importComposable())()
    await fetchFirstPage()
    await archive('a')
    expect(error.value).toBe('Impossible d’archiver cette conversation.')
  })
})
