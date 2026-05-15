<!-- app/features/trajets/components/DeleteTripModal.vue -->
<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

defineProps<{
  isLoading: boolean
}>()

const emit = defineEmits<{
  'confirm': []
  'cancel': []
}>()
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      data-test="delete-modal-backdrop"
      @click.self="emit('cancel')"
    >
      <div class="bg-surface border border-border rounded-card w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div class="flex items-center gap-3">
          <AlertTriangle class="w-6 h-6 text-red-400 flex-shrink-0" />
          <h2 class="font-bold text-text text-lg">Supprimer ce trajet ?</h2>
        </div>
        <p class="text-sm text-text-muted">
          Cette action est irréversible. Les expéditeurs ayant des bids en attente seront notifiés et remboursés automatiquement.
        </p>
        <div class="flex gap-3 pt-2">
          <button
            data-test="delete-modal-cancel"
            class="flex-1 h-10 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
            :disabled="isLoading"
            @click="emit('cancel')"
          >
            Annuler
          </button>
          <button
            data-test="delete-modal-confirm"
            class="flex-1 h-10 rounded-btn bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            :disabled="isLoading"
            @click="emit('confirm')"
          >
            {{ isLoading ? 'Suppression…' : 'Supprimer' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
