<!-- app/features/tarifs/components/PriceGridList.vue -->
<script setup lang="ts">
import { ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-vue-next'
import type { MoveDirection, PriceGridItem } from '@/features/tarifs/types/index'

defineProps<{
  items: PriceGridItem[]
  isSaving: boolean
}>()

const emit = defineEmits<{
  edit: [item: PriceGridItem]
  remove: [id: string]
  move: [payload: { id: string; direction: MoveDirection }]
}>()

function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}
</script>

<template>
  <div>
    <p v-if="items.length === 0" class="py-8 text-center text-sm text-text-muted" data-test="pg-empty">
      Aucune ligne tarifaire. Ajoute ta première ligne ci-dessus.
    </p>

    <ul v-else class="divide-y divide-border" data-test="pg-list">
      <li
        v-for="(item, index) in items"
        :key="item.id"
        class="flex items-center gap-3 py-3"
        :data-test="`pg-row-${item.id}`"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-text truncate">{{ item.label }}</p>
          <p class="text-xs text-text-muted">{{ formatPrice(item.unitPriceDisplay ?? item.unitPriceNet) }}</p>
        </div>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="p-1.5 rounded text-text-muted hover:text-text disabled:opacity-30"
            :disabled="index === 0 || isSaving"
            :data-test="`pg-up-${item.id}`"
            aria-label="Monter"
            @click="emit('move', { id: item.id, direction: 'up' })"
          >
            <ArrowUp class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="p-1.5 rounded text-text-muted hover:text-text disabled:opacity-30"
            :disabled="index === items.length - 1 || isSaving"
            :data-test="`pg-down-${item.id}`"
            aria-label="Descendre"
            @click="emit('move', { id: item.id, direction: 'down' })"
          >
            <ArrowDown class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="p-1.5 rounded text-text-muted hover:text-primary"
            :data-test="`pg-edit-${item.id}`"
            aria-label="Modifier"
            @click="emit('edit', item)"
          >
            <Pencil class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="p-1.5 rounded text-text-muted hover:text-danger disabled:opacity-30"
            :disabled="isSaving"
            :data-test="`pg-delete-${item.id}`"
            aria-label="Supprimer"
            @click="emit('remove', item.id)"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
