import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock useApi pour isoler registerWebDevice
const mockApiFn = vi.fn()
vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
}))

describe('buildWebDeviceName', () => {
  it('détecte Chrome sur Windows', async () => {
    const { buildWebDeviceName } = await import('@/composables/useDeviceRegistration')
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    expect(buildWebDeviceName(ua)).toBe('Chrome sur Windows')
  })

  it('détecte Safari sur macOS', async () => {
    const { buildWebDeviceName } = await import('@/composables/useDeviceRegistration')
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
    expect(buildWebDeviceName(ua)).toBe('Safari sur macOS')
  })

  it('détecte Firefox sur Linux', async () => {
    const { buildWebDeviceName } = await import('@/composables/useDeviceRegistration')
    const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0'
    expect(buildWebDeviceName(ua)).toBe('Firefox sur Linux')
  })

  it('détecte Edge sur Windows', async () => {
    const { buildWebDeviceName } = await import('@/composables/useDeviceRegistration')
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    expect(buildWebDeviceName(ua)).toBe('Edge sur Windows')
  })

  it('détecte Chrome sur Android', async () => {
    const { buildWebDeviceName } = await import('@/composables/useDeviceRegistration')
    const ua = 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    expect(buildWebDeviceName(ua)).toBe('Chrome sur Android')
  })

  it('retourne "Navigateur sur Web" pour un UA inconnu', async () => {
    const { buildWebDeviceName } = await import('@/composables/useDeviceRegistration')
    expect(buildWebDeviceName('')).toBe('Navigateur sur Web')
  })
})

describe('registerWebDevice', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockApiFn.mockReset()
  })

  it('appelle POST /users/me/devices avec platform: "web"', async () => {
    mockApiFn.mockResolvedValue({})
    const { registerWebDevice } = await import('@/composables/useDeviceRegistration')
    await registerWebDevice()
    expect(mockApiFn).toHaveBeenCalledOnce()
    expect(mockApiFn).toHaveBeenCalledWith('/users/me/devices', {
      method: 'POST',
      body: expect.objectContaining({ platform: 'web' }),
    })
  })

  it('inclut un deviceName non vide dans le body', async () => {
    mockApiFn.mockResolvedValue({})
    const { registerWebDevice } = await import('@/composables/useDeviceRegistration')
    await registerWebDevice()
    const callArgs = mockApiFn.mock.calls[0]![1] as { body: { deviceName: string } }
    expect(callArgs.body.deviceName).toBeTruthy()
    expect(typeof callArgs.body.deviceName).toBe('string')
  })

  it("ne propage pas une erreur de l'API (fire-and-forget silencieux)", async () => {
    mockApiFn.mockRejectedValue(new Error('Network error'))
    const { registerWebDevice } = await import('@/composables/useDeviceRegistration')
    // Ne doit pas throw
    await expect(registerWebDevice()).resolves.toBeUndefined()
  })

  it("ne propage pas une erreur 401 de l'API", async () => {
    mockApiFn.mockRejectedValue({ response: { status: 401 } })
    const { registerWebDevice } = await import('@/composables/useDeviceRegistration')
    await expect(registerWebDevice()).resolves.toBeUndefined()
  })
})

describe('isCurrentDeviceRegistered', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockApiFn.mockReset()
  })

  it('retourne true quand la liste contient un device avec isCurrent: true', async () => {
    mockApiFn.mockResolvedValue([
      { deviceId: 'abc', deviceName: 'Chrome sur Windows', platform: 'web', lastSeenAt: '2026-05-22T10:00:00Z', isCurrent: false },
      { deviceId: 'xyz', deviceName: 'iPhone', platform: 'ios', lastSeenAt: '2026-05-22T09:00:00Z', isCurrent: true },
    ])
    const { isCurrentDeviceRegistered } = await import('@/composables/useDeviceRegistration')
    await expect(isCurrentDeviceRegistered()).resolves.toBe(true)
  })

  it("retourne false quand aucun device n'a isCurrent: true (appareil révoqué)", async () => {
    mockApiFn.mockResolvedValue([
      { deviceId: 'abc', deviceName: 'Chrome sur Windows', platform: 'web', lastSeenAt: '2026-05-22T10:00:00Z', isCurrent: false },
      { deviceId: 'xyz', deviceName: 'iPhone', platform: 'ios', lastSeenAt: '2026-05-22T09:00:00Z', isCurrent: false },
    ])
    const { isCurrentDeviceRegistered } = await import('@/composables/useDeviceRegistration')
    await expect(isCurrentDeviceRegistered()).resolves.toBe(false)
  })

  it('retourne false quand la liste est vide (aucun appareil enregistré)', async () => {
    mockApiFn.mockResolvedValue([])
    const { isCurrentDeviceRegistered } = await import('@/composables/useDeviceRegistration')
    await expect(isCurrentDeviceRegistered()).resolves.toBe(false)
  })

  it("retourne true en cas d'erreur réseau (fail-safe : ne pas déconnecter)", async () => {
    mockApiFn.mockRejectedValue(new Error('Network error'))
    const { isCurrentDeviceRegistered } = await import('@/composables/useDeviceRegistration')
    await expect(isCurrentDeviceRegistered()).resolves.toBe(true)
  })

  it("retourne true en cas d'erreur 500 du serveur (fail-safe)", async () => {
    mockApiFn.mockRejectedValue({ response: { status: 500 } })
    const { isCurrentDeviceRegistered } = await import('@/composables/useDeviceRegistration')
    await expect(isCurrentDeviceRegistered()).resolves.toBe(true)
  })
})
