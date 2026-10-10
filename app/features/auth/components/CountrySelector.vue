<script lang="ts">
export { type Country, COUNTRIES } from '../data/countries'
</script>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { ChevronDown, Search } from 'lucide-vue-next'
import { type Country, COUNTRIES } from '../data/countries'

const props = defineProps<{ modelValue: Country }>()
const emit = defineEmits<{ 'update:modelValue': [country: Country] }>()

const open = ref(false)
const query = ref('')
const container = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)

/** Minuscules sans accents, apostrophe courbe ramenée à la droite. */
function fold(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘ʼ`´]/g, "'")
}

/** Recherche par nom (sans accents), indicatif ou code ISO. */
const filtered = computed(() => {
  const needle = fold(query.value)
  if (needle === '') return COUNTRIES
  const digits = needle.replace(/^\+/, '')
  return COUNTRIES.filter(c =>
    fold(c.name).includes(needle)
    || c.code.toLowerCase() === needle
    || (digits !== '' && /^\d+$/.test(digits) && c.dial.slice(1).startsWith(digits)),
  )
})

async function toggle() {
  open.value = !open.value
  if (open.value) {
    query.value = ''
    await nextTick()
    searchInput.value?.focus()
  }
}

function select(country: Country) {
  emit('update:modelValue', country)
  open.value = false
}

function selectFirst() {
  const first = filtered.value[0]
  if (first) select(first)
}

function handleClickOutside(e: MouseEvent) {
  if (container.value && !container.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside, true))
onUnmounted(() => document.removeEventListener('click', handleClickOutside, true))
</script>

<template>
  <div ref="container" class="relative">
    <button
      type="button"
      class="flex items-center gap-1.5 h-11 min-w-[92px] rounded-[10px] border border-border bg-surface-el px-3 text-sm font-semibold text-text hover:border-primary transition-colors"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="`Indicatif : ${props.modelValue.name} ${props.modelValue.dial}`"
      @click.stop="toggle"
    >
      <span>{{ props.modelValue.flag }}</span>
      <span class="tabular-nums">{{ props.modelValue.dial }}</span>
      <ChevronDown class="w-3 h-3 text-subtle ml-auto" :class="{ 'rotate-180': open }" />
    </button>

    <div
      v-if="open"
      class="absolute top-full left-0 mt-1 z-50 bg-surface border border-border rounded-card shadow-xl w-[260px] max-w-[calc(100vw-32px)]"
      @keydown.esc.stop="open = false"
    >
      <div class="flex items-center gap-2 px-3 h-10 border-b border-border">
        <Search class="w-3.5 h-3.5 text-subtle shrink-0" aria-hidden="true" />
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          data-test="country-search"
          placeholder="Rechercher un pays ou un indicatif"
          aria-label="Rechercher un pays ou un indicatif"
          class="flex-1 min-w-0 bg-transparent text-sm text-text placeholder:text-subtle outline-none"
          @keydown.enter.prevent="selectFirst"
        />
      </div>
      <ul role="listbox" class="max-h-64 overflow-y-auto py-1">
        <li
          v-for="country in filtered"
          :key="country.code"
          role="option"
          :aria-selected="country.code === props.modelValue.code"
          class="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-surface-el transition-colors"
          :class="country.code === props.modelValue.code ? 'text-primary font-semibold' : 'text-text'"
          @click="select(country)"
        >
          <span>{{ country.flag }}</span>
          <span class="truncate">{{ country.name }}</span>
          <span class="ml-auto text-subtle text-xs tabular-nums">{{ country.dial }}</span>
        </li>
        <li v-if="filtered.length === 0" class="px-3 py-2 text-sm text-subtle" data-test="country-empty">
          Aucun pays ne correspond.
        </li>
      </ul>
    </div>
  </div>
</template>
