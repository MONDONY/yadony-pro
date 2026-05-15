// app/features/automations/services/automationsService.ts
import { useApi } from '@/composables/useApi'
import type {
  AutomationRule,
  AutomationHistoryEntry,
  CreateCustomRulePayload,
  UpdatePresetPayload,
} from '@/features/automations/types/index'

export function automationsService() {
  const api = useApi()

  async function listRules(): Promise<AutomationRule[]> {
    return api<AutomationRule[]>('/travelers/me/automation-rules')
  }

  async function createRule(payload: CreateCustomRulePayload): Promise<AutomationRule> {
    return api<AutomationRule>('/travelers/me/automation-rules', {
      method: 'POST',
      body: payload,
    })
  }

  async function updateRule(
    id: string,
    payload: UpdatePresetPayload | Partial<CreateCustomRulePayload>,
  ): Promise<AutomationRule> {
    return api<AutomationRule>(`/travelers/me/automation-rules/${id}`, {
      method: 'PUT',
      body: payload,
    })
  }

  async function deleteRule(id: string): Promise<void> {
    return api<void>(`/travelers/me/automation-rules/${id}`, { method: 'DELETE' })
  }

  async function listHistory(): Promise<AutomationHistoryEntry[]> {
    return api<AutomationHistoryEntry[]>('/travelers/me/automation-history')
  }

  return { listRules, createRule, updateRule, deleteRule, listHistory }
}
