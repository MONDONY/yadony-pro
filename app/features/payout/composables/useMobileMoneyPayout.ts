// app/features/payout/composables/useMobileMoneyPayout.ts
import { ref } from 'vue'
import { payoutService } from '@/features/payout/services/payoutService'
import { extractProblem, TECHNICAL_ERROR_PATTERN } from '@/lib/apiError'
import type { MobileMoneyAccount, MobileMoneyProviderCatalogue } from '@/features/payout/types/index'

const ERROR_MESSAGES: Record<string, string> = {
  'mobile-money-invalid-phone': 'Numéro de téléphone invalide pour le versement mobile money.',
  'mobile-money-phone-required': 'Saisis le numéro qui recevra tes versements.',
}

/** Versement des gains par mobile money : activation, réseaux acceptés, désactivation. */
export function useMobileMoneyPayout() {
  const svc = payoutService()

  const account = ref<MobileMoneyAccount | null>(null)
  const catalogue = ref<MobileMoneyProviderCatalogue | null>(null)
  /** Numéro examiné, gardé pour l'activation (il n'est jamais relu depuis le serveur). */
  const phone = ref('')
  const selected = ref<string[]>([])
  const isLoading = ref(false)
  const isWorking = ref(false)
  const error = ref<string | null>(null)
  const unavailable = ref(false)

  function friendly(e: unknown, fallback: string): string {
    const { code, detail } = extractProblem(e)
    if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code]
    return detail && !TECHNICAL_ERROR_PATTERN.test(detail) ? detail : fallback
  }

  async function fetchAccount(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      account.value = await svc.fetchMobileMoneyAccount()
      selected.value = account.value.providers.map((p) => p.code)
    } catch (e) {
      // 403 : le compte n'a pas de rôle voyageur/expéditeur ; 503 : rail désactivé sur ce serveur.
      const status = (e as { status?: number; response?: { status?: number } } | null)?.status
        ?? (e as { response?: { status?: number } } | null)?.response?.status
      if (status === 403 || status === 404 || status === 503) unavailable.value = true
      else error.value = 'Impossible de charger ton compte mobile money.'
    } finally {
      isLoading.value = false
    }
  }

  async function lookup(): Promise<void> {
    const number = phone.value.trim()
    if (!number) {
      error.value = ERROR_MESSAGES['mobile-money-phone-required'] ?? null
      return
    }
    isWorking.value = true
    error.value = null
    try {
      const res = await svc.lookupMobileMoneyProviders(number)
      catalogue.value = res
      const detected = res.providers.find((p) => p.detected)?.code
      selected.value = detected ? [detected] : res.providers.slice(0, 1).map((p) => p.code)
    } catch (e) {
      catalogue.value = null
      error.value = friendly(e, 'Ce numéro ne peut pas recevoir de versement mobile money.')
    } finally {
      isWorking.value = false
    }
  }

  function toggle(code: string): void {
    selected.value = selected.value.includes(code)
      ? selected.value.filter((c) => c !== code)
      : [...selected.value, code]
  }

  async function activate(): Promise<void> {
    if (selected.value.length === 0) {
      error.value = 'Choisis au moins un réseau.'
      return
    }
    isWorking.value = true
    error.value = null
    try {
      account.value = await svc.activateMobileMoney(phone.value.trim(), selected.value)
      catalogue.value = null
      phone.value = ''
    } catch (e) {
      error.value = friendly(e, "Impossible d'activer le versement mobile money.")
    } finally {
      isWorking.value = false
    }
  }

  async function saveProviders(): Promise<void> {
    if (selected.value.length === 0) {
      error.value = 'Garde au moins un réseau, ou désactive le versement.'
      return
    }
    isWorking.value = true
    error.value = null
    try {
      account.value = await svc.updateMobileMoneyProviders(selected.value)
    } catch (e) {
      error.value = friendly(e, 'Impossible de mettre à jour les réseaux.')
    } finally {
      isWorking.value = false
    }
  }

  async function disable(): Promise<void> {
    isWorking.value = true
    error.value = null
    try {
      account.value = await svc.disableMobileMoney()
      selected.value = []
    } catch (e) {
      error.value = friendly(e, 'Impossible de désactiver le versement.')
    } finally {
      isWorking.value = false
    }
  }

  return {
    account, catalogue, phone, selected, isLoading, isWorking, error, unavailable,
    fetchAccount, lookup, toggle, activate, saveProviders, disable,
  }
}
