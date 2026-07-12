// app/features/automations/composables/useAutomations.ts
import { ref, computed } from 'vue'
import { automationsService } from '@/features/automations/services/automationsService'
import type {
  PresetRule,
  CustomRule,
  AutomationRule,
  CreateCustomRulePayload,
  UpdatePresetPayload,
  PresetRuleConfig,
} from '@/features/automations/types/index'

export function useAutomations() {
  const allRules = ref<AutomationRule[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const presetRules = computed<PresetRule[]>(() =>
    allRules.value.filter((r): r is PresetRule => r.ruleType === 'PRESET'),
  )

  const customRules = computed<CustomRule[]>(() =>
    allRules.value.filter((r): r is CustomRule => r.ruleType === 'CUSTOM'),
  )

  const svc = automationsService()

  async function fetchRules(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      allRules.value = await svc.listRules()
    } catch {
      error.value = 'Impossible de charger les règles. Veuillez réessayer.'
    } finally {
      isLoading.value = false
    }
  }

  async function togglePreset(id: string): Promise<void> {
    const preset = presetRules.value.find((r) => r.id === id)
    if (!preset) return
    const payload: UpdatePresetPayload = { enabled: !preset.enabled }
    await svc.updateRule(id, payload)
    await fetchRules()
  }

  async function updatePresetConfig(id: string, config: PresetRuleConfig): Promise<void> {
    const preset = presetRules.value.find((r) => r.id === id)
    if (!preset) return
    const wireConfig: Record<string, number> = {}
    if (config.minRating !== undefined) wireConfig.minRating = config.minRating
    if (config.minFreeKg !== undefined) wireConfig.freedKgThreshold = config.minFreeKg
    if (config.minFreeHours !== undefined) wireConfig.consecutiveHours = config.minFreeHours
    if (config.hoursBeforeDeparture !== undefined) wireConfig.hoursBeforeDeparture = config.hoursBeforeDeparture
    await svc.updateRule(id, { enabled: preset.enabled, config: wireConfig })
    await fetchRules()
  }

  async function saveCustomRule(
    payload: CreateCustomRulePayload,
    id?: string,
  ): Promise<void> {
    if (id) {
      await svc.updateRule(id, payload)
    } else {
      await svc.createRule(payload)
    }
    await fetchRules()
  }

  async function deleteCustomRule(id: string): Promise<void> {
    await svc.deleteRule(id)
    await fetchRules()
  }

  return {
    presetRules,
    customRules,
    isLoading,
    error,
    fetchRules,
    togglePreset,
    updatePresetConfig,
    saveCustomRule,
    deleteCustomRule,
  }
}
