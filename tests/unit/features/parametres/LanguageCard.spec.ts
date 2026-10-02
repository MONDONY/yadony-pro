import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const mockApi = vi.fn()
vi.mock('@/composables/useApi', () => ({ useApi: () => mockApi }))

const user = {
  id: 'u1', phoneNumber: null, displayName: 'Awa', isProAccount: true, roles: ['TRAVELER'], avatarUrl: null,
}

async function mountCard(preferredLanguage?: 'fr' | 'en') {
  setActivePinia(createPinia())
  const { useAuthStore } = await import('@/stores/auth')
  const auth = useAuthStore()
  auth.setSession('tok', { ...user, preferredLanguage })
  const { default: Card } = await import('@/features/parametres/components/LanguageCard.vue')
  return { w: mount(Card), auth }
}

describe('LanguageCard', () => {
  beforeEach(() => {
    vi.resetModules()
    mockApi.mockReset()
  })

  it('présélectionne la langue du compte, français par défaut', async () => {
    const a = await mountCard('en')
    expect(a.w.find('[data-test="language-en"]').attributes('aria-checked')).toBe('true')
    const b = await mountCard()
    expect(b.w.find('[data-test="language-fr"]').attributes('aria-checked')).toBe('true')
  })

  it('enregistre la nouvelle langue par PATCH et met à jour le profil', async () => {
    mockApi.mockResolvedValue({ language: 'en' })
    const { w, auth } = await mountCard('fr')
    await w.find('[data-test="language-en"]').trigger('click')
    await flushPromises()
    expect(mockApi).toHaveBeenCalledWith('/users/me/preferences', { method: 'PATCH', body: { language: 'en' } })
    expect(auth.user?.preferredLanguage).toBe('en')
    expect(w.find('[data-test="language-saved"]').exists()).toBe(true)
  })

  it('ne rappelle pas le serveur pour la langue déjà active', async () => {
    const { w } = await mountCard('fr')
    await w.find('[data-test="language-fr"]').trigger('click')
    expect(mockApi).not.toHaveBeenCalled()
  })

  it('garde la langue actuelle et affiche l\'erreur en cas d\'échec', async () => {
    mockApi.mockRejectedValue({ data: { detail: 'Langue non supportée.' } })
    const { w, auth } = await mountCard('fr')
    await w.find('[data-test="language-en"]').trigger('click')
    await flushPromises()
    expect(auth.user?.preferredLanguage).toBe('fr')
    expect(w.find('[data-test="language-error"]').text()).toBe('Langue non supportée.')
  })
})
