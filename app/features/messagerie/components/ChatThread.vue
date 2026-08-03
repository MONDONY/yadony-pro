<!-- app/features/messagerie/components/ChatThread.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Send } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { ChatMessage } from '@/features/messagerie/types/index'

const props = defineProps<{
  messages: ChatMessage[]
  currentUid: string
  readOnly: boolean
  isSending: boolean
}>()

const emit = defineEmits<{ send: [body: string] }>()

const draft = ref('')

const canSend = computed(() => draft.value.trim().length > 0 && !props.isSending && !props.readOnly)

function formatTime(sentAt: string): string {
  const d = new Date(sentAt)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d)
}

function onSubmit() {
  if (!canSend.value) return
  emit('send', draft.value.trim())
  draft.value = ''
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-4 space-y-2" data-test="chat-messages">
      <p v-if="messages.length === 0" class="text-center text-sm text-text-muted py-8" data-test="chat-empty">
        Aucun message. Démarre la conversation.
      </p>
      <div
        v-for="m in messages"
        :key="m.id"
        class="flex"
        :class="m.senderId === currentUid ? 'justify-end' : 'justify-start'"
        :data-test="`msg-${m.id}`"
      >
        <div
          class="max-w-[75%] rounded-card px-3 py-2 text-sm"
          :class="m.senderId === currentUid ? 'bg-primary text-white' : 'bg-surface-elevated text-text'"
        >
          <img v-if="m.type === 'IMAGE' && m.imageUrl" :src="m.imageUrl" alt="image" class="rounded mb-1 max-w-full" />
          <p v-if="m.type === 'LOCATION'" class="italic opacity-80">📍 Position partagée</p>
          <p v-else-if="m.body" class="whitespace-pre-wrap break-words">{{ m.body }}</p>
          <p class="text-[10px] opacity-60 mt-0.5 text-right">{{ formatTime(m.sentAt) }}</p>
        </div>
      </div>
    </div>

    <form
      v-if="!readOnly"
      class="border-t border-border p-3 flex items-center gap-2"
      data-test="chat-form"
      @submit.prevent="onSubmit"
    >
      <input
        v-model="draft"
        data-test="chat-input"
        type="text"
        placeholder="Écris ton message…"
        class="flex-1 min-w-0 h-10 rounded-btn border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:border-primary"
      />
      <Button type="submit" size="icon" class="shrink-0" data-test="chat-send" :disabled="!canSend" aria-label="Envoyer">
        <Send class="w-4 h-4" />
      </Button>
    </form>
    <p v-else class="border-t border-border p-3 text-center text-sm text-text-muted" data-test="chat-readonly">
      Cette conversation est en lecture seule.
    </p>
  </div>
</template>
