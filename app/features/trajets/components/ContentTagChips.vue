<script setup lang="ts">
import { ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{
  modelValue: string[]
  presets?: string[]
  placeholder?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [v: string[]] }>()

const customInput = ref('')

function toggle(tag: string) {
  const current = props.modelValue
  if (current.includes(tag)) {
    emit('update:modelValue', current.filter(t => t !== tag))
  } else {
    emit('update:modelValue', [...current, tag])
  }
}

function addCustom() {
  const val = customInput.value.trim()
  if (!val || props.modelValue.includes(val)) return
  emit('update:modelValue', [...props.modelValue, val])
  customInput.value = ''
}

function remove(tag: string) {
  emit('update:modelValue', props.modelValue.filter(t => t !== tag))
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    addCustom()
  }
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="presets && presets.length" class="flex flex-wrap gap-2">
      <button
        v-for="tag in presets"
        :key="tag"
        type="button"
        :class="cn(
          'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
          modelValue.includes(tag)
            ? 'bg-primary/10 border-primary text-primary'
            : 'border-border text-text-muted hover:border-primary/50 hover:text-text',
        )"
        @click="toggle(tag)"
      >
        {{ tag }}
      </button>
    </div>

    <div v-if="modelValue.some(t => !presets?.includes(t))" class="flex flex-wrap gap-2">
      <span
        v-for="tag in modelValue.filter(t => !presets?.includes(t))"
        :key="tag"
        class="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-primary/10 border border-primary text-primary"
      >
        {{ tag }}
        <button class="hover:text-red-400 transition-colors" @click="remove(tag)">
          <X class="w-3 h-3" />
        </button>
      </span>
    </div>

    <div class="flex gap-2">
      <input
        v-model="customInput"
        type="text"
        :placeholder="placeholder ?? 'Ajouter un tag personnalisé…'"
        class="flex-1 h-9 px-3 rounded-btn border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
        @keydown="onKeydown"
      />
      <button
        type="button"
        class="h-9 px-3 rounded-btn border border-border text-text-muted hover:text-text hover:border-primary/50 transition-colors"
        @click="addCustom"
      >
        <Plus class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
