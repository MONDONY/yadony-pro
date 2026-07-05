<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, XCircle } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import type { AutomationHistoryEntry } from '@/features/automations/types/index'

const props = defineProps<{
  entry: AutomationHistoryEntry
}>()

const formattedDate = computed(() => {
  const d = new Date(props.entry.triggeredAt)
  return d.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <div
    :data-test="`history-item-${entry.id}`"
    class="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0"
  >
    <div class="flex-shrink-0 mt-0.5">
      <CheckCircle
        v-if="entry.result === 'SUCCESS'"
        class="w-4 h-4 text-success"
      />
      <XCircle
        v-else
        class="w-4 h-4 text-danger"
      />
    </div>

    <div class="flex-1 min-w-0 space-y-0.5">
      <p class="text-sm text-text leading-snug">
        <span class="font-medium text-primary">{{ entry.ruleLabel }}</span>
        <span class="text-text-muted"> — {{ entry.actionTaken }}</span>
      </p>
      <div class="flex items-center gap-2 text-xs text-text-muted flex-wrap">
        <time :datetime="entry.triggeredAt" class="font-mono tabular-nums">{{ formattedDate }}</time>
        <template v-if="entry.bidId">
          <span class="text-border" aria-hidden="true">·</span>
          <span class="font-mono tabular-nums">Bid {{ entry.bidId.slice(0, 8) }}…</span>
        </template>
      </div>
    </div>

    <Badge
      :variant="entry.result === 'SUCCESS' ? 'success' : 'danger'"
      size="sm"
      class="flex-shrink-0"
    >
      {{ entry.result === 'SUCCESS' ? 'Succès' : 'Échec' }}
    </Badge>
  </div>
</template>
