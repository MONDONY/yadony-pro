<script setup lang="ts">
defineProps<{
  totalOpenRequests?: number  // nombre de demandes ouvertes à explorer (optionnel)
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20 text-center px-6">
    <span class="text-5xl mb-4" aria-hidden="true">🧳</span>
    <h3 class="font-semibold text-text text-base mb-1.5">Crée ton premier trajet</h3>
    <p class="text-sm text-text-muted max-w-xs mb-6">
      Les demandes compatibles apparaissent ici dès que tu as un trajet actif.
      Tu peux aussi explorer les demandes et créer un trajet depuis une demande qui t'intéresse.
    </p>
    <a
      data-test="empty-create-trip-btn"
      href="/trajets/nouveau"
      class="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-btn hover:bg-primary/90 transition-colors"
    >
      + Créer un trajet
    </a>
    <div v-if="totalOpenRequests && totalOpenRequests > 0" class="mt-5 pt-5 border-t border-border w-full max-w-xs">
      <p class="text-xs text-text-muted">
        ou explore les
        <span class="font-semibold text-text">{{ totalOpenRequests }}</span>
        demandes ouvertes ↓
      </p>
    </div>
  </div>
</template>
