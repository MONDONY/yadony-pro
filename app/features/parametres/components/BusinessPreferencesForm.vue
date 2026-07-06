<!-- app/features/parametres/components/BusinessPreferencesForm.vue -->
<script setup lang="ts">
import { reactive, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  WEIGHT_UNIT_OPTIONS,
  CURRENCY_OPTIONS,
  CONTACT_MODE_OPTIONS,
  type BusinessPreferences,
} from '@/features/parametres/types/index'

const props = defineProps<{
  modelValue: BusinessPreferences
  isSaving: boolean
}>()

const emit = defineEmits<{
  submit: [value: BusinessPreferences]
}>()

const form = reactive<BusinessPreferences>({ ...props.modelValue })

watch(
  () => props.modelValue,
  (next) => Object.assign(form, next),
  { deep: true },
)

function onSubmit() {
  emit('submit', {
    weightUnit: form.weightUnit,
    currencyCode: form.currencyCode,
    pickupRadiusKm: Number(form.pickupRadiusKm),
    defaultPackageWeightKg: Number(form.defaultPackageWeightKg),
    minBidPriceEur: Number(form.minBidPriceEur),
    contactMode: form.contactMode,
    responseDelayHours:
      form.responseDelayHours === null || form.responseDelayHours === undefined
        ? null
        : Number(form.responseDelayHours),
  })
}

const inputClass =
  'h-9 w-full rounded-btn border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:border-primary transition-colors'
const labelClass = 'block text-sm font-medium text-text mb-1.5'
</script>

<template>
  <form class="space-y-5" data-test="business-prefs-form" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Unité de poids -->
      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="weightUnit">Unité de poids</label>
        <select id="weightUnit" v-model="form.weightUnit" data-test="field-weightUnit" :class="inputClass">
          <option v-for="opt in WEIGHT_UNIT_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <!-- Devise -->
      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="currencyCode">Devise</label>
        <select id="currencyCode" v-model="form.currencyCode" data-test="field-currencyCode" :class="inputClass">
          <option v-for="opt in CURRENCY_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <!-- Rayon de collecte -->
      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="pickupRadiusKm">Rayon de collecte (km)</label>
        <input
          id="pickupRadiusKm"
          v-model.number="form.pickupRadiusKm"
          data-test="field-pickupRadiusKm"
          type="number"
          min="1"
          max="50"
          :class="inputClass"
        />
      </div>

      <!-- Poids colis par défaut -->
      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="defaultPackageWeightKg">Poids colis par défaut (kg)</label>
        <input
          id="defaultPackageWeightKg"
          v-model.number="form.defaultPackageWeightKg"
          data-test="field-defaultPackageWeightKg"
          type="number"
          min="1"
          max="50"
          :class="inputClass"
        />
      </div>

      <!-- Prix minimum accepté -->
      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="minBidPriceEur">Prix minimum accepté (€)</label>
        <input
          id="minBidPriceEur"
          v-model.number="form.minBidPriceEur"
          data-test="field-minBidPriceEur"
          type="number"
          min="0"
          max="50"
          :class="inputClass"
        />
      </div>

      <!-- Délai de réponse -->
      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="responseDelayHours">Délai de réponse cible (h)</label>
        <input
          id="responseDelayHours"
          v-model.number="form.responseDelayHours"
          data-test="field-responseDelayHours"
          type="number"
          min="1"
          placeholder="Optionnel"
          :class="inputClass"
        />
      </div>

      <!-- Mode de contact -->
      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="contactMode">Mode de contact préféré</label>
        <select id="contactMode" v-model="form.contactMode" data-test="field-contactMode" :class="inputClass">
          <option :value="null">Non défini</option>
          <option v-for="opt in CONTACT_MODE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <div class="flex justify-end">
      <Button type="submit" data-test="submit-prefs" :disabled="isSaving">
        {{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}
      </Button>
    </div>
  </form>
</template>
