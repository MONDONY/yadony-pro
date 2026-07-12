<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { X, Plus, Trash2 } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { configService, type ContentCategory } from '@/features/trajets/services/configService'
import type {
  CustomRule,
  ConditionField,
  ConditionOperator,
  ActionType,
  RuleCondition,
  RuleAction,
  CreateCustomRulePayload,
} from '@/features/automations/types/index'

const props = defineProps<{
  modelValue: boolean
  rule?: CustomRule
}>()

const emit = defineEmits<{
  'cancel': []
  'save': [payload: CreateCustomRulePayload]
}>()

// Option sentinelle du <select> des types de contenu qui bascule sur la
// saisie libre. Ne collisionne jamais avec le catalogue (aucun libellé ne
// s'appelle « Autre valeur… »).
const OTHER_CONTENT_TYPE_OPTION = 'Autre valeur…'

const name = ref('')
const conditions = ref<RuleCondition[]>([])
const action = ref<RuleAction>({ type: 'auto_accept' })
const validationError = ref<string | null>(null)

// Catalogue des types de contenu (Task 3). Chargé une fois à l'ouverture du
// modal ; en cas d'échec on retombe silencieusement sur la saisie libre au
// lieu de bloquer la création de règle.
const contentCategories = ref<ContentCategory[]>([])
const contentCategoriesFailed = ref(false)
// Un booléen par condition : true → saisie libre affichée pour content_type
// (soit parce que l'utilisateur a choisi « Autre valeur… », soit parce que
// la valeur existante ne correspond à aucun libellé du catalogue).
const customContentTypeMode = ref<boolean[]>([])

function isCatalogLabel(value: string): boolean {
  return contentCategories.value.some((c) => c.label === value)
}

function computeCustomMode(condition: RuleCondition): boolean {
  return condition.field === 'content_type' && !!condition.value && !isCatalogLabel(condition.value)
}

onMounted(async () => {
  try {
    contentCategories.value = await configService().fetchContentCategories()
    customContentTypeMode.value = conditions.value.map(computeCustomMode)
  } catch {
    contentCategoriesFailed.value = true
  }
})

const conditionFieldOptions: Array<{ value: ConditionField; label: string }> = [
  { value: 'sender_rating', label: 'Note expéditeur' },
  { value: 'weight_kg', label: 'Poids demandé (kg)' },
  { value: 'corridor', label: 'Corridor' },
  { value: 'content_type', label: 'Type de contenu' },
  { value: 'capacity_free_kg', label: 'Capacité libre (kg)' },
  { value: 'hours_before_departure', label: 'Délai avant départ (h)' },
]

const conditionOperatorOptions: Array<{ value: ConditionOperator; label: string }> = [
  { value: 'gte', label: '≥' },
  { value: 'lte', label: '≤' },
  { value: 'eq', label: '=' },
]

const actionTypeOptions: Array<{ value: ActionType; label: string }> = [
  { value: 'auto_accept', label: 'Accepter automatiquement' },
  { value: 'auto_reject', label: 'Refuser automatiquement' },
  { value: 'trigger_search', label: 'Déclencher une recherche de demandes' },
  { value: 'send_alert', label: "M'envoyer une alerte (push + email)" },
  { value: 'invite_sender', label: "Inviter l'expéditeur sur le trajet" },
  { value: 'close_announcement', label: "Fermer l'annonce" },
]

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (props.rule) {
        name.value = props.rule.name
        conditions.value = props.rule.conditions.map((c) => ({ ...c }))
        action.value = { ...props.rule.action }
      } else {
        name.value = ''
        conditions.value = []
        action.value = { type: 'auto_accept' }
      }
      customContentTypeMode.value = conditions.value.map(computeCustomMode)
      validationError.value = null
    }
  },
  { immediate: true },
)

function addCondition(): void {
  conditions.value = [
    ...conditions.value,
    { field: 'sender_rating', operator: 'gte', value: '' },
  ]
  customContentTypeMode.value = [...customContentTypeMode.value, false]
}

function removeCondition(index: number): void {
  conditions.value = conditions.value.filter((_, i) => i !== index)
  customContentTypeMode.value = customContentTypeMode.value.filter((_, i) => i !== index)
}

// Changer de champ doit toujours réinitialiser la valeur : on ne veut pas
// garder un « 4.5 » (note expéditeur) sur une condition de type de contenu.
function onFieldChange(index: number): void {
  const condition = conditions.value[index]
  if (!condition) return
  condition.value = ''
  customContentTypeMode.value[index] = false
}

function onContentTypeSelectChange(index: number, value: string): void {
  const condition = conditions.value[index]
  if (!condition) return
  if (value === OTHER_CONTENT_TYPE_OPTION) {
    customContentTypeMode.value[index] = true
    condition.value = ''
  } else {
    condition.value = value
  }
}

function submit(): void {
  validationError.value = null
  if (!name.value.trim()) {
    validationError.value = 'Le nom de la règle est requis.'
    return
  }
  if (conditions.value.length === 0) {
    validationError.value = 'Ajoutez au moins une condition.'
    return
  }
  const payload: CreateCustomRulePayload = {
    ruleType: 'CUSTOM',
    name: name.value.trim(),
    conditions: conditions.value,
    action: action.value,
  }
  emit('save', payload)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" @click="emit('cancel')" />

        <!-- Panel -->
        <div class="relative w-full max-w-2xl bg-surface border border-border rounded-card shadow-pop flex flex-col max-h-[90vh]">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <h2 class="font-display text-lg font-bold">
              {{ rule ? 'Modifier la règle' : 'Créer une règle personnalisée' }}
            </h2>
            <button
              data-test="modal-close-btn"
              class="p-1.5 text-text-muted hover:text-text rounded transition-colors"
              aria-label="Fermer"
              type="button"
              @click="emit('cancel')"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            <!-- Rule name -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-text" for="rule-name">
                Nom de la règle
              </label>
              <input
                id="rule-name"
                v-model="name"
                data-test="rule-name-input"
                type="text"
                placeholder="Ex : Acceptation rapide corridors prioritaires"
                class="w-full h-10 px-3 rounded-input bg-bg border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>

            <!-- Validation error -->
            <p
              v-if="validationError"
              data-test="validation-error"
              class="text-sm text-danger font-medium"
            >
              {{ validationError }}
            </p>

            <!-- Conditions (SI) -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-text">
                  <span class="bg-primary/15 text-primary px-2 py-0.5 rounded text-xs font-bold mr-2">SI</span>
                  Conditions
                </h3>
                <button
                  data-test="add-condition-btn"
                  class="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                  type="button"
                  @click="addCondition"
                >
                  <Plus class="w-3.5 h-3.5" />
                  Ajouter une condition
                </button>
              </div>

              <div
                v-if="conditions.length === 0"
                class="py-6 text-center text-sm text-text-muted border border-dashed border-border rounded-el"
              >
                Aucune condition. Cliquez sur "Ajouter une condition".
              </div>

              <div
                v-for="(condition, index) in conditions"
                :key="index"
                data-test="condition-row"
                class="flex items-center gap-2 p-3 bg-bg border border-border rounded-el"
              >
                <select
                  v-model="condition.field"
                  :data-test="`condition-field-${index}`"
                  class="flex-1 h-9 px-2 rounded-input bg-surface border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
                  @change="onFieldChange(index)"
                >
                  <option v-for="opt in conditionFieldOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>

                <select
                  v-model="condition.operator"
                  :data-test="`condition-operator-${index}`"
                  class="w-16 h-9 px-2 rounded-input bg-surface border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
                >
                  <option v-for="opt in conditionOperatorOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>

                <select
                  v-if="condition.field === 'content_type' && !contentCategoriesFailed && !customContentTypeMode[index]"
                  :data-test="`condition-value-${index}`"
                  :value="condition.value"
                  class="w-28 h-9 px-2 rounded-input bg-surface border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
                  @change="onContentTypeSelectChange(index, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="" disabled>Sélectionner…</option>
                  <option v-for="cat in contentCategories" :key="cat.code" :value="cat.label">
                    {{ cat.label }}
                  </option>
                  <option :value="OTHER_CONTENT_TYPE_OPTION">{{ OTHER_CONTENT_TYPE_OPTION }}</option>
                </select>
                <input
                  v-else
                  v-model="condition.value"
                  :data-test="`condition-value-${index}`"
                  type="text"
                  placeholder="Valeur"
                  class="w-28 h-9 px-2 rounded-input bg-surface border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />

                <button
                  :data-test="`delete-condition-${index}`"
                  class="p-1.5 text-text-muted hover:text-danger transition-colors rounded flex-shrink-0"
                  type="button"
                  :aria-label="`Supprimer la condition ${index + 1}`"
                  @click="removeCondition(index)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Action (ALORS) -->
            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-text">
                <span class="bg-primary/15 text-primary px-2 py-0.5 rounded text-xs font-bold mr-2">ALORS</span>
                Action
              </h3>

              <div class="p-3 bg-bg border border-border rounded-el space-y-3">
                <select
                  v-model="action.type"
                  data-test="action-type-select"
                  class="w-full h-9 px-2 rounded-input bg-surface border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
                >
                  <option v-for="opt in actionTypeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>

                <div v-if="action.type === 'auto_reject'" class="space-y-1">
                  <label class="text-xs text-text-muted">Message de refus (optionnel)</label>
                  <input
                    v-model="action.message"
                    data-test="action-message-input"
                    type="text"
                    placeholder="Ex : Poids trop élevé pour ce trajet"
                    class="w-full h-9 px-2 rounded-input bg-surface border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
            <button
              data-test="modal-cancel-btn"
              class="h-9 px-4 rounded-btn border border-border text-sm font-medium text-text-muted hover:text-text transition-colors"
              type="button"
              @click="emit('cancel')"
            >
              Annuler
            </button>
            <button
              data-test="modal-save-btn"
              :class="cn(
                'h-9 px-5 rounded-btn text-sm font-semibold transition-colors',
                'bg-primary text-on-primary hover:bg-primary-hover',
              )"
              type="button"
              @click="submit"
            >
              {{ rule ? 'Enregistrer les modifications' : 'Créer la règle' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
