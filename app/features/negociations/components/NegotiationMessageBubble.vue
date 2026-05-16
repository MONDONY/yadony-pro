<!-- app/features/negociations/components/NegotiationMessageBubble.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { NegotiationMessage } from '@/features/negociations/types'

const props = defineProps<{
  message: NegotiationMessage
  isMine: boolean
}>()

const KIND_LABEL: Record<string, string> = {
  PROPOSAL: 'Proposition initiale',
  COUNTER: 'Contre-proposition',
  ACCEPT: 'Proposition acceptée',
  REJECT: 'Négociation refusée',
}

const formattedDate = computed(() =>
  new Date(props.message.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  }),
)
</script>

<template>
  <div :class="['flex', isMine ? 'justify-end' : 'justify-start']">
    <div
      class="max-w-[75%] space-y-1"
      :class="isMine ? 'items-end' : 'items-start'"
    >
      <p class="text-[10px] font-medium text-text-muted px-1" :class="isMine ? 'text-right' : 'text-left'">
        {{ KIND_LABEL[message.kind] ?? message.kind }}
      </p>

      <div
        :class="[
          'rounded-2xl px-4 py-2.5 space-y-1',
          isMine
            ? 'bg-primary text-white rounded-tr-sm'
            : 'bg-surface border border-border text-text rounded-tl-sm',
          message.kind === 'ACCEPT' ? 'border-green-400/50 bg-green-500/10 text-green-300' : '',
          message.kind === 'REJECT' ? 'border-red-400/50 bg-red-500/10 text-red-300' : '',
        ]"
      >
        <p
          v-if="message.proposedPriceEur !== null"
          class="text-lg font-bold"
        >
          {{ message.proposedPriceEur }} €
        </p>

        <p v-if="message.body" class="text-sm leading-relaxed">{{ message.body }}</p>
      </div>

      <p class="text-[10px] text-text-muted px-1" :class="isMine ? 'text-right' : 'text-left'">
        {{ formattedDate }}
      </p>
    </div>
  </div>
</template>
