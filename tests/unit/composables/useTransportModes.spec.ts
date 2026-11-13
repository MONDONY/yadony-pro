import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApi = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApi,
}))

async function load() {
  return await import('@/composables/useTransportModes')
}

describe('useTransportModes', () => {
  beforeEach(() => {
    vi.resetModules()
    mockApi.mockReset()
  })

  it('lit GET /config/transport-modes et met en cache', async () => {
    mockApi.mockResolvedValue({ road: true, boat: false })
    const { useTransportModes } = await load()
    const { getFlags } = useTransportModes()
    expect(await getFlags()).toEqual({ road: true, boat: false })
    expect(await getFlags()).toEqual({ road: true, boat: false })
    expect(mockApi).toHaveBeenCalledTimes(1)
    expect(mockApi).toHaveBeenCalledWith('/config/transport-modes')
  })

  it('partage la requête entre appelants concurrents', async () => {
    mockApi.mockResolvedValue({ road: false, boat: true })
    const { useTransportModes } = await load()
    const [a, b] = await Promise.all([useTransportModes().getFlags(), useTransportModes().getFlags()])
    expect(a).toEqual({ road: false, boat: true })
    expect(b).toEqual(a)
    expect(mockApi).toHaveBeenCalledTimes(1)
  })

  it('404 : avion seul, sans cache', async () => {
    mockApi.mockRejectedValueOnce({ statusCode: 404 })
    const { useTransportModes } = await load()
    const { getFlags } = useTransportModes()
    expect(await getFlags()).toEqual({ road: false, boat: false })
    mockApi.mockResolvedValueOnce({ road: true, boat: false })
    expect(await getFlags()).toEqual({ road: true, boat: false })
  })

  it('réponse invalide : avion seul, sans cache', async () => {
    mockApi.mockResolvedValueOnce({ road: 'oui' })
    const { useTransportModes } = await load()
    const { getFlags } = useTransportModes()
    expect(await getFlags()).toEqual({ road: false, boat: false })
    mockApi.mockResolvedValueOnce(null)
    expect(await getFlags()).toEqual({ road: false, boat: false })
    expect(mockApi).toHaveBeenCalledTimes(2)
  })

  it('resetTransportModesCache vide le cache', async () => {
    mockApi.mockResolvedValue({ road: true, boat: true })
    const { useTransportModes, resetTransportModesCache } = await load()
    await useTransportModes().getFlags()
    resetTransportModesCache()
    await useTransportModes().getFlags()
    expect(mockApi).toHaveBeenCalledTimes(2)
  })
})
