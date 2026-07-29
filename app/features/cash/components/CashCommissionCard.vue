<!-- app/features/cash/components/CashCommissionCard.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CreditCard, Trash2 } from 'lucide-vue-next'
import { cashCommissionService, type CommissionMethod } from '@/features/cash/services/cashCommissionService'

const method = ref<CommissionMethod | null>(null)
const isLoading = ref(false)
const isDetaching = ref(false)

const svc = cashCommissionService()

async function load() {
  isLoading.value = true
  try {
    method.value = await svc.getMethod()
  } catch {
    method.value = null // pas bloquant : état vide
  } finally {
    isLoading.value = false
  }
}

async function detach() {
  isDetaching.value = true
  try {
    await svc.detachMethod()
    await load()
  } finally {
    isDetaching.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="bg-surface border border-border rounded-card p-5 space-y-3" data-test="cash-card">
    <header class="flex items-center justify-between">
      <div>
        <h2 class="font-display font-semibold text-base text-text">Commission espèces</h2>
        <p class="text-sm text-text-muted">
          Carte utilisée pour prélever la commission quand un expéditeur paie en espèces.
        </p>
      </div>
      <CreditCard class="w-5 h-5 text-text-subtle" />
    </header>

    <div v-if="isLoading" class="h-10 bg-border rounded animate-pulse" data-test="cash-loading" />

    <div v-else-if="method" class="flex items-center gap-3">
      <span class="text-sm font-medium text-text capitalize">{{ method.brand }}</span>
      <span class="text-sm text-text-muted font-mono tabular-nums">•••• {{ method.last4 }}</span>
      <span class="text-xs text-text-subtle">exp. {{ String(method.expMonth).padStart(2, '0') }}/{{ method.expYear }}</span>
      <span
        v-if="method.expirationStatus === 'EXPIRED'"
        class="px-2 py-0.5 rounded-full text-xs font-medium bg-danger/20 text-danger"
        data-test="cash-expired"
      >
        Expirée
      </span>
      <button
        :disabled="isDetaching"
        data-test="cash-detach"
        aria-label="Supprimer la carte"
        class="ml-auto p-2 rounded-btn text-text-subtle hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
        @click="detach"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>

    <p v-else class="text-sm text-text-muted" data-test="cash-empty">
      Aucune carte enregistrée. Ajoute-la depuis l'app mobile Yadony (Profil → Paiements cash)
      pour pouvoir accepter les colis payés en espèces.
    </p>
  </section>
</template>
