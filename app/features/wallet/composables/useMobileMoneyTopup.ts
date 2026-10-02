// app/features/wallet/composables/useMobileMoneyTopup.ts
import { computed, onScopeDispose, ref } from 'vue'
import { walletService } from '@/features/wallet/services/walletService'
import { extractProblem, TECHNICAL_ERROR_PATTERN } from '@/lib/apiError'
import type {
  MobileMoneyProviders, MobileMoneyTopupStarted, MobileMoneyTopupState,
} from '@/features/wallet/types/index'

/** Intervalle entre deux lectures du statut pendant l'attente du code PIN. */
export const TOPUP_POLL_INTERVAL_MS = 3000
/** Au-delà, on arrête de relire : le paiement a pu aboutir, le solde se met à jour seul. */
export const TOPUP_POLL_MAX_MS = 3 * 60 * 1000

const ERROR_MESSAGES: Record<string, string> = {
  'topup-phone-required': 'Saisis le numéro mobile money à débiter.',
}

type Step = 'phone' | 'details' | 'waiting' | 'done'

/**
 * Recharge du portefeuille par mobile money (pawaPay) : numéro, choix du réseau,
 * paiement, puis relecture du statut jusqu'à confirmation ou échec. La devise créditée
 * est celle de l'opérateur du numéro, pas celle du portefeuille actif.
 */
export function useMobileMoneyTopup(onConfirmed?: () => void) {
  const svc = walletService()

  const step = ref<Step>('phone')
  const phone = ref('')
  const providers = ref<MobileMoneyProviders | null>(null)
  const provider = ref<string | null>(null)
  const started = ref<MobileMoneyTopupStarted | null>(null)
  const state = ref<MobileMoneyTopupState | null>(null)
  const isBusy = ref(false)
  const error = ref<string | null>(null)
  const timedOut = ref(false)

  let timer: ReturnType<typeof setTimeout> | null = null
  let pollStartedAt = 0

  const currency = computed(() => providers.value?.currency ?? started.value?.currency ?? null)

  function friendly(e: unknown, fallback: string): string {
    const { code, detail } = extractProblem(e)
    if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code]
    return detail && !TECHNICAL_ERROR_PATTERN.test(detail) ? detail : fallback
  }

  async function lookupProviders(): Promise<void> {
    const number = phone.value.trim()
    if (!number) {
      error.value = ERROR_MESSAGES['topup-phone-required'] ?? null
      return
    }
    isBusy.value = true
    error.value = null
    try {
      const res = await svc.getMobileMoneyProviders(number)
      providers.value = res
      provider.value = res.providers.find((p) => p.detected)?.code ?? res.providers[0]?.code ?? null
      step.value = 'details'
    } catch (e) {
      error.value = friendly(e, "Impossible de reconnaître ce numéro. Vérifie-le et réessaie.")
    } finally {
      isBusy.value = false
    }
  }

  function stopPolling(): void {
    if (timer) clearTimeout(timer)
    timer = null
  }

  async function poll(): Promise<void> {
    const id = started.value?.topupId
    if (!id) return
    try {
      const res = await svc.getTopupStatus(id)
      state.value = res
      if (res.status !== 'PENDING') {
        step.value = 'done'
        if (res.status === 'CONFIRMED') onConfirmed?.()
        return
      }
    } catch {
      // Une lecture ratée n'annule pas le paiement : on réessaie au prochain tour.
    }
    if (Date.now() - pollStartedAt >= TOPUP_POLL_MAX_MS) {
      timedOut.value = true
      return
    }
    timer = setTimeout(poll, TOPUP_POLL_INTERVAL_MS)
  }

  async function pay(amount: number): Promise<void> {
    if (!provider.value) return
    isBusy.value = true
    error.value = null
    try {
      started.value = await svc.startMobileMoneyTopup({
        amount,
        phoneNumber: phone.value.trim(),
        provider: provider.value,
      })
      state.value = null
      timedOut.value = false
      step.value = 'waiting'
      pollStartedAt = Date.now()
      timer = setTimeout(poll, TOPUP_POLL_INTERVAL_MS)
    } catch (e) {
      error.value = friendly(e, 'Impossible de lancer la recharge. Réessaie.')
    } finally {
      isBusy.value = false
    }
  }

  function reset(): void {
    stopPolling()
    step.value = 'phone'
    providers.value = null
    provider.value = null
    started.value = null
    state.value = null
    error.value = null
    timedOut.value = false
  }

  onScopeDispose(stopPolling)

  return {
    step, phone, providers, provider, started, state, currency, isBusy, error, timedOut,
    lookupProviders, pay, reset,
  }
}
