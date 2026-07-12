<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { SectionLabel } from '@/components/ui/section-label'
import { useAutomations } from '@/features/automations/composables/useAutomations'
import { useAutomationHistory } from '@/features/automations/composables/useAutomationHistory'
import PresetRuleCard from '@/features/automations/components/PresetRuleCard.vue'
import CustomRuleCard from '@/features/automations/components/CustomRuleCard.vue'
import AutomationHistoryItem from '@/features/automations/components/AutomationHistoryItem.vue'
import AutomationRuleModal from '@/features/automations/components/AutomationRuleModal.vue'
import type { CustomRule, CreateCustomRulePayload, PresetRuleConfig } from '@/features/automations/types/index'

const {
  presetRules,
  customRules,
  isLoading: rulesLoading,
  error: rulesError,
  fetchRules,
  togglePreset,
  updatePresetConfig,
  saveCustomRule,
  deleteCustomRule,
} = useAutomations()

const {
  entries: historyEntries,
  isLoading: historyLoading,
  error: historyError,
  fetchHistory,
} = useAutomationHistory()

const isModalOpen = ref(false)
const editingRule = ref<CustomRule | undefined>(undefined)
const isUpdatingPreset = ref<string | null>(null)
const isDeletingRule = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([fetchRules(), fetchHistory()])
})

async function handleTogglePreset(id: string): Promise<void> {
  isUpdatingPreset.value = id
  try {
    await togglePreset(id)
  } finally {
    isUpdatingPreset.value = null
  }
}

async function handleUpdatePresetConfig(id: string, config: PresetRuleConfig): Promise<void> {
  isUpdatingPreset.value = id
  try {
    await updatePresetConfig(id, config)
  } finally {
    isUpdatingPreset.value = null
  }
}

function openCreateModal(): void {
  editingRule.value = undefined
  isModalOpen.value = true
}

function openEditModal(rule: CustomRule): void {
  editingRule.value = rule
  isModalOpen.value = true
}

function closeModal(): void {
  isModalOpen.value = false
  editingRule.value = undefined
}

async function handleSave(payload: CreateCustomRulePayload): Promise<void> {
  await saveCustomRule(payload, editingRule.value?.id)
  closeModal()
  await fetchHistory()
}

async function handleDeleteCustomRule(id: string): Promise<void> {
  isDeletingRule.value = id
  try {
    await deleteCustomRule(id)
    await fetchHistory()
  } finally {
    isDeletingRule.value = null
  }
}
</script>

<template>
  <div class="space-y-8">

    <div
      v-if="rulesError"
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <p class="text-danger font-medium">{{ rulesError }}</p>
      <button
        class="mt-4 px-4 py-2 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
        type="button"
        @click="fetchRules()"
      >
        Réessayer
      </button>
    </div>

    <template v-else>

      <section>
        <div class="mb-4">
          <SectionLabel as="h2">Règles préconfigurées</SectionLabel>
          <p class="text-xs text-text-muted mt-1">
            6 règles prêtes à l'emploi — activez-les en un clic.
          </p>
        </div>

        <div v-if="rulesLoading" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="i in 6"
            :key="i"
            class="h-20 rounded-el border border-border bg-surface shadow-card animate-pulse"
          />
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <PresetRuleCard
            v-for="rule in presetRules"
            :key="rule.id"
            :rule="rule"
            :is-updating="isUpdatingPreset === rule.id"
            @toggle="handleTogglePreset"
            @update-config="handleUpdatePresetConfig"
          />
          <p
            v-if="presetRules.length === 0"
            class="col-span-full py-8 text-center text-sm text-text-muted"
          >
            Aucune règle préconfigurée disponible.
          </p>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-4">
          <div>
            <SectionLabel as="h2">Règles personnalisées</SectionLabel>
            <p class="text-xs text-text-muted mt-1">
              Construisez vos propres règles SI → ALORS.
            </p>
          </div>
          <button
            data-test="create-custom-rule-btn"
            class="flex items-center gap-1.5 h-9 px-4 rounded-btn bg-primary text-on-primary text-sm font-semibold shadow-btn hover:bg-primary-hover transition-colors"
            type="button"
            @click="openCreateModal"
          >
            <Plus class="w-4 h-4" />
            Nouvelle règle
          </button>
        </div>

        <div v-if="rulesLoading" class="space-y-3">
          <div
            v-for="i in 2"
            :key="i"
            class="h-28 rounded-el border border-border bg-surface shadow-card animate-pulse"
          />
        </div>

        <div v-else class="space-y-3">
          <CustomRuleCard
            v-for="rule in customRules"
            :key="rule.id"
            :rule="rule"
            :is-deleting="isDeletingRule === rule.id"
            @edit="openEditModal"
            @delete="handleDeleteCustomRule"
          />
          <div
            v-if="customRules.length === 0"
            class="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-el text-center"
          >
            <p class="text-sm text-text-muted mb-3">
              Aucune règle personnalisée. Créez la vôtre.
            </p>
            <button
              class="flex items-center gap-1.5 h-8 px-3 rounded-btn border border-border text-xs font-medium text-text-muted hover:text-text transition-colors"
              type="button"
              @click="openCreateModal"
            >
              <Plus class="w-3.5 h-3.5" />
              Créer une règle
            </button>
          </div>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-4">
          <div>
            <SectionLabel as="h2">Historique des automatisations</SectionLabel>
            <p class="text-xs text-text-muted mt-1">
              Les 50 dernières actions déclenchées automatiquement.
            </p>
          </div>
          <button
            data-test="refresh-history-btn"
            :disabled="historyLoading"
            class="p-1.5 text-text-muted hover:text-text transition-colors rounded disabled:opacity-50"
            type="button"
            aria-label="Rafraîchir l'historique"
            @click="fetchHistory()"
          >
            <RefreshCw :class="['w-4 h-4', { 'animate-spin': historyLoading }]" />
          </button>
        </div>

        <p
          v-if="historyError"
          class="py-6 text-center text-sm text-danger"
        >
          {{ historyError }}
        </p>

        <div
          v-else-if="historyLoading"
          class="rounded-el border border-border bg-surface shadow-card divide-y divide-border"
        >
          <div
            v-for="i in 5"
            :key="i"
            class="h-16 animate-pulse px-4 py-3 flex items-center gap-3"
          >
            <div class="w-4 h-4 rounded-full bg-border flex-shrink-0" />
            <div class="flex-1 space-y-1.5">
              <div class="h-3 bg-border rounded w-3/4" />
              <div class="h-2 bg-border rounded w-1/3" />
            </div>
          </div>
        </div>

        <p
          v-else-if="historyEntries.length === 0"
          class="py-10 text-center text-sm text-text-muted border border-dashed border-border rounded-el"
        >
          Aucune action automatique pour l'instant.
        </p>

        <div
          v-else
          class="rounded-el border border-border bg-surface shadow-card divide-y divide-border"
        >
          <AutomationHistoryItem
            v-for="entry in historyEntries"
            :key="entry.id"
            :entry="entry"
          />
        </div>
      </section>

    </template>

    <AutomationRuleModal
      :model-value="isModalOpen"
      :rule="editingRule"
      @cancel="closeModal"
      @save="handleSave"
    />

  </div>
</template>
