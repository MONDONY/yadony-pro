// app/features/automations/types/index.ts

export type RuleType = 'PRESET' | 'CUSTOM'

export type PresetRuleId =
  | 'auto_accept_trusted'
  | 'auto_reject_overweight'
  | 'auto_close_full'
  | 'alert_capacity_free'
  | 'notify_loyal_senders'
  | 'alert_last_minute_bid'

export type ConditionField =
  | 'sender_rating'
  | 'weight_kg'
  | 'corridor'
  | 'content_type'
  | 'capacity_free_kg'
  | 'hours_before_departure'

export type ConditionOperator = 'gte' | 'lte' | 'eq'

export type ActionType =
  | 'auto_accept'
  | 'auto_reject'
  | 'trigger_search'
  | 'send_alert'
  | 'invite_sender'
  | 'close_announcement'

export interface RuleCondition {
  field: ConditionField
  operator: ConditionOperator
  value: string
}

export interface RuleAction {
  type: ActionType
  message?: string
}

export interface PresetRuleConfig {
  minRating?: number
  minFreeKg?: number
  minFreeHours?: number
}

export interface PresetRule {
  id: PresetRuleId
  ruleType: 'PRESET'
  enabled: boolean
  label: string
  description: string
  isConfigurable: boolean
  config: PresetRuleConfig
}

export interface CustomRule {
  id: string
  ruleType: 'CUSTOM'
  enabled: boolean
  name: string
  conditions: RuleCondition[]
  action: RuleAction
  createdAt: string
}

export type AutomationRule = PresetRule | CustomRule

export interface CreateCustomRulePayload {
  ruleType: 'CUSTOM'
  name: string
  conditions: RuleCondition[]
  action: RuleAction
}

export interface UpdatePresetPayload {
  enabled: boolean
  config?: PresetRuleConfig
}

export type AutomationHistoryResult = 'SUCCESS' | 'FAILURE'

export interface AutomationHistoryEntry {
  id: string
  triggeredAt: string
  ruleId: string
  ruleLabel: string
  bidId: string | null
  tripId: string | null
  actionTaken: string
  result: AutomationHistoryResult
}
