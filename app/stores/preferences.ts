import { defineStore } from 'pinia'
import { businessPrefsService } from '@/features/parametres/services/businessPrefsService'
import { normalizeCurrency } from '@/lib/money'

interface PreferencesState {
  /** Devise active du voyageur (préférences métier), EUR tant qu'elle n'est pas chargée. */
  currency: string
  loaded: boolean
  loading: boolean
}

// Vérité unique sur la devise active : le formulaire de trajet, le portefeuille
// et les paramètres doivent lire et écrire la MÊME valeur. Le backend résout la
// devise d'un nouveau trajet depuis ces préférences ; le portail envoyait EUR en
// dur et publiait un trajet en euros pour un voyageur en francs CFA.
export const usePreferencesStore = defineStore('preferences', {
  state: (): PreferencesState => ({
    currency: 'EUR',
    loaded: false,
    loading: false,
  }),
  actions: {
    /** Charge la devise active une fois ; renvoie la devise connue (EUR en repli). */
    async load(force = false): Promise<string> {
      if (this.loaded && !force) return this.currency
      if (this.loading) return this.currency
      this.loading = true
      try {
        const prefs = await businessPrefsService().fetchPreferences()
        this.currency = normalizeCurrency(prefs.currencyCode)
        this.loaded = true
      } catch {
        // Repli EUR : on retentera au prochain appel, l'écran reste utilisable.
      } finally {
        this.loading = false
      }
      return this.currency
    },

    /** À appeler quand l'utilisateur enregistre une nouvelle devise dans ses paramètres. */
    setCurrency(code: string): void {
      this.currency = normalizeCurrency(code)
      this.loaded = true
    },
  },
})
