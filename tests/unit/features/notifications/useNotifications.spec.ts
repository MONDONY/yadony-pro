import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockList = vi.fn()
const mockUnread = vi.fn()
const mockMarkRead = vi.fn()
const mockMarkAllRead = vi.fn()
const mockRemove = vi.fn()

vi.mock('@/features/notifications/services/notificationsService', () => ({
  notificationsService: () => ({
    list: mockList,
    unreadCount: mockUnread,
    markRead: mockMarkRead,
    markAllRead: mockMarkAllRead,
    remove: mockRemove,
  }),
}))

async function importComposable() {
  const mod = await import('@/features/notifications/composables/useNotifications')
  return mod.useNotifications
}

function notif(id: string, read = false) {
  return { id, type: 'BID', title: `T${id}`, body: 'b', data: {}, read, createdAt: '2026-05-27T10:00:00' }
}

function pageOf(content: ReturnType<typeof notif>[], last = true, page = 0) {
  return { content, page, size: 30, totalElements: content.length, totalPages: 1, last }
}

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchFirstPage loads notifications and the last flag', async () => {
    mockList.mockResolvedValue(pageOf([notif('a'), notif('b')], false))
    const { notifications, last, fetchFirstPage } = (await importComposable())()
    await fetchFirstPage()
    expect(notifications.value).toHaveLength(2)
    expect(last.value).toBe(false)
  })

  it('sets an error when fetchFirstPage rejects', async () => {
    mockList.mockRejectedValue(new Error('x'))
    const { error, fetchFirstPage } = (await importComposable())()
    await fetchFirstPage()
    expect(error.value).toBe('Impossible de charger tes notifications.')
  })

  it('loadMore appends the next page and stops at the last page', async () => {
    mockList.mockResolvedValueOnce(pageOf([notif('a')], false, 0))
    const { notifications, last, fetchFirstPage, loadMore } = (await importComposable())()
    await fetchFirstPage()
    mockList.mockResolvedValueOnce(pageOf([notif('b')], true, 1))
    await loadMore()
    expect(notifications.value.map((n) => n.id)).toEqual(['a', 'b'])
    expect(last.value).toBe(true)
    await loadMore() // no-op now that last is true
    expect(mockList).toHaveBeenCalledTimes(2)
  })

  it('refreshUnread sets the unread counter', async () => {
    mockUnread.mockResolvedValue(7)
    const { unread, refreshUnread } = (await importComposable())()
    await refreshUnread()
    expect(unread.value).toBe(7)
  })

  it('markRead marks the notification read and decrements unread', async () => {
    mockList.mockResolvedValue(pageOf([notif('a', false)]))
    mockUnread.mockResolvedValue(1)
    mockMarkRead.mockResolvedValue(undefined)
    const { notifications, unread, fetchFirstPage, refreshUnread, markRead } = (await importComposable())()
    await fetchFirstPage()
    await refreshUnread()
    await markRead('a')
    expect(notifications.value[0].read).toBe(true)
    expect(unread.value).toBe(0)
  })

  it('markRead is a no-op for an already-read notification', async () => {
    mockList.mockResolvedValue(pageOf([notif('a', true)]))
    const { fetchFirstPage, markRead } = (await importComposable())()
    await fetchFirstPage()
    await markRead('a')
    expect(mockMarkRead).not.toHaveBeenCalled()
  })

  it('markAllRead marks everything read and zeroes the counter', async () => {
    mockList.mockResolvedValue(pageOf([notif('a'), notif('b')]))
    mockMarkAllRead.mockResolvedValue(undefined)
    const { notifications, unread, fetchFirstPage, markAllRead } = (await importComposable())()
    await fetchFirstPage()
    await markAllRead()
    expect(notifications.value.every((n) => n.read)).toBe(true)
    expect(unread.value).toBe(0)
  })

  it('remove deletes the notification and decrements unread when it was unread', async () => {
    mockList.mockResolvedValue(pageOf([notif('a', false), notif('b', true)]))
    mockUnread.mockResolvedValue(1)
    mockRemove.mockResolvedValue(undefined)
    const { notifications, unread, fetchFirstPage, refreshUnread, remove } = (await importComposable())()
    await fetchFirstPage()
    await refreshUnread()
    await remove('a')
    expect(notifications.value.map((n) => n.id)).toEqual(['b'])
    expect(unread.value).toBe(0)
  })
})
