<script setup lang="ts">
import { computed } from 'vue'
import { Wrench } from 'lucide-vue-next'
import { useMaintenanceStore } from '@/stores/maintenance'

/** Page unique du portail pendant la maintenance ; se referme seule à la réouverture. */
const store = useMaintenanceStore()

const DEFAULT_MESSAGE = 'Nous améliorons Yadony. Revenez un peu plus tard : vos colis, trajets et paiements sont en sécurité.'

const message = computed(() => store.message?.trim() || DEFAULT_MESSAGE)
const endTime = computed(() => {
  if (!store.estimatedEndAt) return null
  const d = new Date(store.estimatedEndAt)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d)
})
</script>

<template>
  <div
    role="alertdialog" aria-modal="true" aria-labelledby="maintenance-title"
    data-test="maintenance-screen"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-bg px-4"
  >
    <div class="w-full max-w-md text-center">
      <div class="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Wrench :size="26" aria-hidden="true" />
      </div>
      <h1 id="maintenance-title" class="font-display text-2xl font-bold text-text text-balance">
        Yadony est en maintenance
      </h1>
      <p data-test="maintenance-message" class="mt-3 text-sm text-text-subtle text-pretty">{{ message }}</p>
      <p v-if="endTime" data-test="maintenance-end" class="mt-4 text-sm font-semibold text-text tabular-nums">
        Retour prévu vers {{ endTime }}
      </p>
      <button
        type="button" data-test="maintenance-retry" :disabled="store.checking"
        class="mt-8 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text transition-[background-color,transform] hover:bg-surface-elevated active:scale-[0.97] disabled:opacity-40"
        @click="store.retry()"
      >{{ store.checking ? 'Vérification…' : 'Réessayer' }}</button>
      <p class="mt-4 text-xs text-text-subtle text-pretty">
        Cette page se fermera toute seule dès que Yadony sera de nouveau disponible.
      </p>
    </div>
  </div>
</template>
