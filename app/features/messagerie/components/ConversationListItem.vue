<!-- app/features/messagerie/components/ConversationListItem.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Archive } from 'lucide-vue-next'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Conversation } from '@/features/messagerie/types/index'

const props = defineProps<{ conversation: Conversation }>()

const emit = defineEmits<{ archive: [id: string] }>()

const initials = computed(() =>
  (props.conversation.otherParticipant.name || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const corridor = computed(() => {
  const { tripOrigin, tripDestination } = props.conversation
  if (tripOrigin && tripDestination) return `${tripOrigin} → ${tripDestination}`
  return null
})

const time = computed(() => {
  if (!props.conversation.lastMessageAt) return ''
  const d = new Date(props.conversation.lastMessageAt)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(d)
})
</script>

<template>
  <div class="flex items-start gap-3 py-3 px-3 hover:bg-surface-elevated rounded-btn transition-colors" :data-test="`conv-${conversation.id}`">
    <NuxtLink :to="`/messages/${conversation.id}`" class="flex items-start gap-3 flex-1 min-w-0" :data-test="`conv-open-${conversation.id}`">
      <Avatar class="h-10 w-10 shrink-0">
        <AvatarFallback class="bg-primary/15 text-primary text-sm">{{ initials }}</AvatarFallback>
      </Avatar>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <p class="text-sm font-medium text-text truncate">{{ conversation.otherParticipant.name }}</p>
          <span
            v-if="conversation.hasUnread"
            class="h-2 w-2 rounded-full bg-primary shrink-0"
            data-test="conv-unread"
          />
          <span class="ml-auto text-xs text-text-muted shrink-0">{{ time }}</span>
        </div>
        <p v-if="corridor" class="text-xs text-text-muted">{{ corridor }}</p>
        <p class="text-sm text-text-muted truncate">{{ conversation.lastMessagePreview ?? 'Aucun message' }}</p>
        <p v-if="conversation.readOnly" class="text-xs text-warning mt-0.5" data-test="conv-readonly">
          Conversation en lecture seule
        </p>
      </div>
    </NuxtLink>
    <button
      type="button"
      class="p-1.5 rounded text-text-muted hover:text-text shrink-0"
      :data-test="`conv-archive-${conversation.id}`"
      aria-label="Archiver"
      @click="emit('archive', conversation.id)"
    >
      <Archive class="w-4 h-4" />
    </button>
  </div>
</template>
