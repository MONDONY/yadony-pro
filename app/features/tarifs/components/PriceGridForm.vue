<!-- app/features/tarifs/components/PriceGridForm.vue -->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Button } from '@/components/ui/button'
import type { PriceGridItem, PriceGridItemInput } from '@/features/tarifs/types/index'

const props = defineProps<{
  editing: PriceGridItem | null
  isSaving: boolean
}>()

const emit = defineEmits<{
  submit: [value: PriceGridItemInput]
  cancel: []
}>()

const label = ref('')
const unitPriceNet = ref<number | null>(null)

watch(
  () => props.editing,
  (item) => {
    label.value = item?.label ?? ''
    unitPriceNet.value = item?.unitPriceNet ?? null
  },
  { immediate: true },
)

const canSubmit = computed(
  () => label.value.trim().length > 0 && unitPriceNet.value !== null && unitPriceNet.value >= 0.01,
)

function onSubmit() {
  if (!canSubmit.value || unitPriceNet.value === null) return
  emit('submit', { label: label.value.trim(), unitPriceNet: Number(unitPriceNet.value) })
  if (!props.editing) {
    label.value = ''
    unitPriceNet.value = null
  }
}

const inputClass =
  'h-9 w-full rounded-btn border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:border-primary transition-colors'
</script>

<template>
  <form class="flex flex-col sm:flex-row sm:items-end gap-3" data-test="price-grid-form" @submit.prevent="onSubmit">
    <div class="flex-1">
      <label class="block text-sm font-medium text-text mb-1.5" for="pg-label">Intitulé</label>
      <input
        id="pg-label"
        v-model="label"
        data-test="pg-label"
        type="text"
        maxlength="100"
        placeholder="Ex. Paris → Dakar, par kg"
        :class="inputClass"
      />
    </div>
    <div class="w-full sm:w-40">
      <label class="block text-sm font-medium text-text mb-1.5" for="pg-price">Prix net (€)</label>
      <input
        id="pg-price"
        v-model.number="unitPriceNet"
        data-test="pg-price"
        type="number"
        min="0.01"
        step="0.01"
        placeholder="12.00"
        :class="inputClass"
      />
    </div>
    <div class="flex items-center gap-2">
      <Button type="submit" data-test="pg-submit" :disabled="!canSubmit || isSaving">
        {{ editing ? 'Modifier' : 'Ajouter' }}
      </Button>
      <Button v-if="editing" type="button" variant="outline" data-test="pg-cancel" @click="emit('cancel')">
        Annuler
      </Button>
    </div>
  </form>
</template>
