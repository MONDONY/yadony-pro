import { describe, it, expect, beforeEach } from 'vitest'

// happy-dom fournit window.localStorage et crypto.randomUUID
// On réimporte le module à chaque test pour éviter les effets de bord du module cache

describe('getDeviceId', () => {
  beforeEach(() => {
    // Nettoyer localStorage avant chaque test
    window.localStorage.clear()
  })

  it('génère un UUID et le persiste dans localStorage si absent', async () => {
    const { getDeviceId } = await import('@/lib/deviceId')
    const id = getDeviceId()
    expect(id).toBeTruthy()
    // Format UUID v4
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(window.localStorage.getItem('dony_device_id')).toBe(id)
  })

  it('retourne le même id au 2e appel (pas de régénération)', async () => {
    const { getDeviceId } = await import('@/lib/deviceId')
    const first = getDeviceId()
    const second = getDeviceId()
    expect(first).toBe(second)
    // localStorage ne contient qu'une seule valeur
    expect(window.localStorage.getItem('dony_device_id')).toBe(first)
  })

  it('retourne le deviceId déjà stocké dans localStorage', async () => {
    const existingId = 'aaaabbbb-cccc-dddd-eeee-ffffffffffff'
    window.localStorage.setItem('dony_device_id', existingId)
    const { getDeviceId } = await import('@/lib/deviceId')
    const id = getDeviceId()
    expect(id).toBe(existingId)
  })
})
