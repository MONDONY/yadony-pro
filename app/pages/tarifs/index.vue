<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePriceGrid } from '@/features/tarifs/composables/usePriceGrid'
import PriceGridForm from '@/features/tarifs/components/PriceGridForm.vue'
import PriceGridList from '@/features/tarifs/components/PriceGridList.vue'
import type { MoveDirection, PriceGridItem, PriceGridItemInput } from '@/features/tarifs/types/index'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Grille tarifaire',
  pageSubtitle: 'Tes tarifs de référence, réutilisés dans tes annonces',
})

const { items, isLoading, isSaving, error, fetchItems, addItem, updateItem, removeItem, move } =
  usePriceGrid()

const editing = ref<PriceGridItem | null>(null)

onMounted(() => {
  fetchItems()
})

async function onSubmit(input: PriceGridItemInput) {
  const ok = editing.value ? await updateItem(editing.value.id, input) : await addItem(input)
  if (ok) editing.value = null
}

function onEdit(item: PriceGridItem) {
  editing.value = item
}

function onMove(payload: { id: string; direction: MoveDirection }) {
  move(payload.id, payload.direction)
}
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <section class="bg-surface border border-border rounded-card p-5">
      <header class="mb-4">
        <h2 class="font-display font-semibold text-base text-text">
          {{ editing ? 'Modifier une ligne' : 'Ajouter une ligne' }}
        </h2>
        <p class="text-sm text-text-muted">Définis un intitulé et un prix net de référence.</p>
      </header>
      <PriceGridForm :editing="editing" :is-saving="isSaving" @submit="onSubmit" @cancel="editing = null" />
    </section>

    <section class="bg-surface border border-border rounded-card p-5">
      <p v-if="error" class="mb-3 text-sm text-danger" data-test="pg-error">{{ error }}</p>
      <div v-if="isLoading" class="py-8 text-center text-sm text-text-muted" data-test="pg-loading">Chargement…</div>
      <PriceGridList
        v-else
        :items="items"
        :is-saving="isSaving"
        @edit="onEdit"
        @remove="removeItem"
        @move="onMove"
      />
    </section>
  </div>
</template>
