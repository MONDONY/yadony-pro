import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetchMatchingRequests = vi.fn()
const mockInviteRequest = vi.fn()

vi.mock('@/features/demandes/services/matchingService', () => ({
  matchingService: () => ({
    fetchMatchingRequests: mockFetchMatchingRequests,
    inviteRequest: mockInviteRequest,
  }),
}))

async function importUseMatchingRequests() {
  const mod = await import('@/features/demandes/composables/useMatchingRequests')
  return mod.useMatchingRequests
}

const fakeRequests = [
  {
    id: 'req-1',
    tripId: 'trip-1',
    tripCorridor: 'Paris → Dakar',
    senderName: 'Fatou Diallo',
    senderInitials: 'FD',
    senderRating: 4.8,
    senderTotalSent: 12,
    weightKg: 10,
    contentType: 'Vêtements',
    budgetPerKg: 8,
    messageExcerpt: 'Bonjour, envoi urgent...',
    matchScore: 92,
    requestedAt: '2026-05-15T08:00:00Z',
  },
]

describe('useMatchingRequests', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetchMatchingRequests.mockReset()
    mockInviteRequest.mockReset()
  })

  it('initial state: requests empty, isLoading false, error null', async () => {
    mockFetchMatchingRequests.mockResolvedValue([])
    const useMatchingRequests = await importUseMatchingRequests()
    const { requests, isLoading, error } = useMatchingRequests()
    expect(requests.value).toEqual([])
    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('fetchRequests sets isLoading true during fetch then false after', async () => {
    let resolve: (v: unknown) => void
    mockFetchMatchingRequests.mockReturnValue(new Promise((r) => (resolve = r)))
    const useMatchingRequests = await importUseMatchingRequests()
    const { isLoading, fetchRequests } = useMatchingRequests()
    const promise = fetchRequests()
    expect(isLoading.value).toBe(true)
    resolve!(fakeRequests)
    await promise
    expect(isLoading.value).toBe(false)
  })

  it('fetchRequests populates requests on success', async () => {
    mockFetchMatchingRequests.mockResolvedValue(fakeRequests)
    const useMatchingRequests = await importUseMatchingRequests()
    const { requests, fetchRequests } = useMatchingRequests()
    await fetchRequests()
    expect(requests.value).toHaveLength(1)
    expect(requests.value[0].id).toBe('req-1')
  })

  it('fetchRequests sets error message on failure', async () => {
    mockFetchMatchingRequests.mockRejectedValue(new Error('Network error'))
    const useMatchingRequests = await importUseMatchingRequests()
    const { error, fetchRequests } = useMatchingRequests()
    await fetchRequests()
    expect(error.value).toBe('Impossible de charger les demandes compatibles. Veuillez réessayer.')
  })

  it('fetchRequests clears error before each fetch', async () => {
    mockFetchMatchingRequests.mockRejectedValueOnce(new Error('fail'))
    mockFetchMatchingRequests.mockResolvedValueOnce([])
    const useMatchingRequests = await importUseMatchingRequests()
    const { error, fetchRequests } = useMatchingRequests()
    await fetchRequests()
    expect(error.value).not.toBeNull()
    await fetchRequests()
    expect(error.value).toBeNull()
  })

  it('inviteRequest sets invitingId during call then resets to null', async () => {
    let resolve: (v: unknown) => void
    mockInviteRequest.mockReturnValue(new Promise((r) => (resolve = r)))
    const useMatchingRequests = await importUseMatchingRequests()
    const { invitingId, inviteRequest } = useMatchingRequests()
    const promise = inviteRequest('req-1', 'trip-1')
    expect(invitingId.value).toBe('req-1')
    resolve!(undefined)
    await promise
    expect(invitingId.value).toBeNull()
  })

  it('inviteRequest adds requestId to invitedIds on success', async () => {
    mockInviteRequest.mockResolvedValue(undefined)
    const useMatchingRequests = await importUseMatchingRequests()
    const { invitedIds, inviteRequest } = useMatchingRequests()
    await inviteRequest('req-1', 'trip-1')
    expect(invitedIds.value.has('req-1')).toBe(true)
  })

  it('inviteRequest sets error on failure', async () => {
    mockInviteRequest.mockRejectedValue(new Error('Server error'))
    const useMatchingRequests = await importUseMatchingRequests()
    const { error, inviteRequest } = useMatchingRequests()
    await inviteRequest('req-1', 'trip-42')
    expect(error.value).toBe("Impossible d'envoyer l'invitation. Veuillez réessayer.")
  })

  it('inviteRequest does not add to invitedIds when API call fails', async () => {
    mockInviteRequest.mockRejectedValue(new Error('Server error'))
    const useMatchingRequests = await importUseMatchingRequests()
    const { invitedIds, inviteRequest } = useMatchingRequests()
    await inviteRequest('req-1', 'trip-42')
    expect(invitedIds.value.has('req-1')).toBe(false)
  })

  it('inviteRequest resets invitingId to null even when call fails', async () => {
    mockInviteRequest.mockRejectedValue(new Error('Server error'))
    const useMatchingRequests = await importUseMatchingRequests()
    const { invitingId, inviteRequest } = useMatchingRequests()
    await inviteRequest('req-1', 'trip-42')
    expect(invitingId.value).toBeNull()
  })
})
