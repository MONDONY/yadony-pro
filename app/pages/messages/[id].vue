<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { useChatThread } from '@/features/messagerie/composables/useChatThread'
import ChatThread from '@/features/messagerie/components/ChatThread.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Conversation',
})

const route = useRoute()
const conversationId = route.params.id as string

const { conversation, messages, currentUid, isLoading, isSending, error, start, send } =
  useChatThread(conversationId)

const corridor = computed(() => {
  const c = conversation.value
  if (c?.tripOrigin && c?.tripDestination) return `${c.tripOrigin} → ${c.tripDestination}`
  return null
})

onMounted(() => {
  start()
})
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <NuxtLink to="/messages" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-3">
      <ArrowLeft class="w-4 h-4" /> Messagerie
    </NuxtLink>

    <div class="bg-surface border border-border rounded-card overflow-hidden flex flex-col" style="height: 70vh">
      <header class="border-b border-border px-4 py-3">
        <p class="font-medium text-text" data-test="chat-title">
          {{ conversation?.otherParticipant.name ?? 'Conversation' }}
        </p>
        <p v-if="corridor" class="text-xs text-text-muted">{{ corridor }}</p>
      </header>

      <p v-if="error" class="px-4 py-2 text-sm text-danger" data-test="chat-error">{{ error }}</p>
      <div v-if="isLoading" class="flex-1 flex items-center justify-center text-sm text-text-muted" data-test="chat-loading">
        Chargement…
      </div>
      <ChatThread
        v-else
        class="flex-1 min-h-0"
        :messages="messages"
        :current-uid="currentUid"
        :read-only="conversation?.readOnly ?? false"
        :is-sending="isSending"
        @send="send"
      />
    </div>
  </div>
</template>
