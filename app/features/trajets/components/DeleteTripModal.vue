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
      <div class="w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-pop space-y-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-el bg-danger/10">
            <AlertTriangle class="w-5 h-5 text-danger" />
          </div>
          <h2 class="font-display text-lg font-semibold text-text">Supprimer ce trajet ?</h2>
        </div>
        <p class="text-sm text-text-muted">
          Cette action est irréversible. Les expéditeurs ayant des bids en attente seront notifiés et remboursés automatiquement.
        </p>
        <div class="flex gap-3 pt-2">
          <button
            data-test="delete-modal-cancel"
            class="flex-1 h-10 rounded-btn border border-border-strong text-sm text-text hover:bg-surface-el transition-colors"
            :disabled="isLoading"
            @click="emit('cancel')"
          >
            Annuler
          </button>
          <button
            data-test="delete-modal-confirm"
            class="flex-1 h-10 rounded-btn bg-danger text-on-danger text-sm font-medium hover:bg-danger-hover transition-colors disabled:opacity-50"
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
