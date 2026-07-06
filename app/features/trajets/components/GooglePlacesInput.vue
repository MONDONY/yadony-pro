<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Search, X, Loader2 } from 'lucide-vue-next'
import { placesService } from '@/features/trajets/services/placesService'
import { cn } from '@/lib/utils'
import type { PlaceSuggestion, SelectedPlace } from '@/features/trajets/types/index'

const props = defineProps<{
  modelValue: SelectedPlace | null
  placeholder?: string
  label?: string
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SelectedPlace | null]
}>()

const query = ref('')
const suggestions = ref<PlaceSuggestion[]>([])
const isOpen = ref(false)
const isLoading = ref(false)
let sessionToken = ''
let debounceTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (props.modelValue) {
    query.value = props.modelValue.label
  }
})

// Garde le champ synchronisé quand modelValue est défini de l'extérieur
// (prefill d'édition, modèle rapide, réinitialisation).
watch(
  () => props.modelValue,
  (val) => {
    query.value = val?.label ?? ''
  },
)

const svc = placesService()

function generateSessionToken(): string {
  return crypto.randomUUID()
}

async function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  query.value = value

  if (!sessionToken) {
    sessionToken = generateSessionToken()
  }

  if (debounceTimer) clearTimeout(debounceTimer)

  if (value.trim().length < 2) {
    suggestions.value = []
    isOpen.value = false
    return
  }

  debounceTimer = setTimeout(async () => {
    isLoading.value = true
    try {
      suggestions.value = await svc.autocomplete(value.trim(), sessionToken)
      isOpen.value = suggestions.value.length > 0
    } catch {
      suggestions.value = []
      isOpen.value = false
    } finally {
      isLoading.value = false
    }
  }, 300)
}

async function selectSuggestion(suggestion: PlaceSuggestion) {
  isLoading.value = true
  try {
    const details = await svc.getDetails(suggestion.placeId, sessionToken)
    const selected: SelectedPlace = {
      placeId: suggestion.placeId,
      label: details.label,
      lat: details.lat,
      lng: details.lng,
    }
    emit('update:modelValue', selected)
    query.value = details.label
    sessionToken = ''
    suggestions.value = []
    isOpen.value = false
  } catch {
    // keep current state on error
  } finally {
    isLoading.value = false
  }
}

function clear() {
  query.value = ''
  suggestions.value = []
  isOpen.value = false
  sessionToken = ''
  emit('update:modelValue', null)
}

function onBlur() {
  setTimeout(() => { isOpen.value = false }, 150)
}
</script>

<template>
  <div class="relative">
    <label v-if="label" class="block text-sm font-medium text-text mb-1.5">
      {{ label }}
    </label>
    <div
      :class="cn(
        'flex items-center gap-2 h-10 px-3 rounded-btn border bg-surface transition-colors',
        error ? 'border-danger' : 'border-border focus-within:border-primary',
      )"
    >
      <Loader2 v-if="isLoading" class="w-4 h-4 text-text-muted animate-spin shrink-0" />
      <Search v-else class="w-4 h-4 text-text-muted shrink-0" />
      <input
        :value="query"
        :placeholder="placeholder ?? 'Rechercher une ville…'"
        class="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none"
        autocomplete="off"
        @input="onInput"
        @blur="onBlur"
      />
      <button
        v-if="modelValue || query"
        class="text-text-muted hover:text-text transition-colors"
        @click="clear"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>

    <div
      v-if="isOpen && suggestions.length > 0"
      class="absolute z-50 top-full mt-1 left-0 right-0 bg-surface-elevated border border-border rounded-btn shadow-lg overflow-hidden"
    >
      <button
        v-for="s in suggestions"
        :key="s.placeId"
        class="w-full text-left px-4 py-2.5 hover:bg-surface transition-colors border-b border-border last:border-b-0"
        @mousedown.prevent="selectSuggestion(s)"
      >
        <p class="text-sm text-text font-medium">{{ s.mainText }}</p>
        <p class="text-xs text-text-muted">{{ s.secondaryText }}</p>
      </button>
    </div>
  </div>
</template>
