<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Table « Comptoir ». Écris du `<thead>/<tbody>` sémantique dans le slot ;
 * le style (en-têtes discrets, lignes à filet, hover) est appliqué aux
 * `th`/`td` descendants. Ajoute la classe `num` à une colonne chiffrée pour
 * l'aligner à droite en Geist Mono tabular. Le conteneur scrolle en x seul.
 */
defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div class="w-full overflow-x-auto">
    <table :class="cn('dony-table w-full border-collapse text-sm', $props.class)">
      <slot />
    </table>
  </div>
</template>

<style scoped>
.dony-table :deep(th) {
  text-align: left;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--subtle);
  padding: 0 14px 12px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.dony-table :deep(td) {
  padding: 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  color: var(--text);
}
.dony-table :deep(tbody tr:last-child td) {
  border-bottom: 0;
}
.dony-table :deep(tbody tr) {
  transition: background-color 0.12s ease;
}
.dony-table :deep(tbody tr:hover) {
  background-color: var(--surface-el);
}
.dony-table :deep(th.num),
.dony-table :deep(td.num) {
  text-align: right;
  font-family: 'Geist Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}
</style>
