import { useApi } from '@/composables/useApi'

/** Construit un nom lisible depuis le user agent (ex: "Chrome sur Windows"). */
export function buildWebDeviceName(userAgent: string): string {
  const browser = /Edg/.test(userAgent) ? 'Edge'
    : /Chrome/.test(userAgent) ? 'Chrome'
    : /Firefox/.test(userAgent) ? 'Firefox'
    : /Safari/.test(userAgent) ? 'Safari'
    : 'Navigateur'
  const os = /Windows/.test(userAgent) ? 'Windows'
    : /Mac OS|Macintosh/.test(userAgent) ? 'macOS'
    : /Android/.test(userAgent) ? 'Android'
    : /Linux/.test(userAgent) ? 'Linux'
    : /iPhone|iPad/.test(userAgent) ? 'iOS'
    : 'Web'
  return `${browser} sur ${os}`
}

/**
 * Enregistre la session web courante dans user_devices (fire-and-forget).
 * N'échoue jamais l'appelant — les erreurs sont avalées silencieusement.
 */
export async function registerWebDevice(): Promise<void> {
  try {
    const api = useApi()
    const deviceName = buildWebDeviceName(
      typeof navigator !== 'undefined' ? navigator.userAgent : '',
    )
    await api('/users/me/devices', {
      method: 'POST',
      body: { deviceName, platform: 'web' },
    })
  } catch {
    // silencieux — l'enregistrement ne doit pas bloquer l'app
  }
}
