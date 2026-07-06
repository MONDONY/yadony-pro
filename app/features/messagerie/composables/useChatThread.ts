import { ref, onUnmounted } from 'vue'
import { conversationsService } from '@/features/messagerie/services/conversationsService'
import { firestoreChatService } from '@/features/messagerie/services/firestoreChatService'
import type { ChatMessage, Conversation } from '@/features/messagerie/types/index'

export function useChatThread(conversationId: string) {
  const conversation = ref<Conversation | null>(null)
  const messages = ref<ChatMessage[]>([])
  const currentUid = ref('')
  const isLoading = ref(false)
  const isSending = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null
  const convSvc = conversationsService()

  async function start(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const conv = await convSvc.getById(conversationId)
      conversation.value = conv

      if (import.meta.client) {
        const { $firebaseFirestore, $firebaseAuth } = useNuxtApp()
        currentUid.value = $firebaseAuth?.currentUser?.uid ?? ''
        const chat = firestoreChatService($firebaseFirestore)
        unsubscribe = chat.subscribeMessages(
          conv.firestoreConversationId,
          (msgs) => {
            messages.value = msgs
          },
          () => {
            error.value = 'Impossible de charger les messages en temps réel.'
          },
        )
      }
    } catch {
      error.value = 'Impossible de charger la conversation.'
    } finally {
      isLoading.value = false
    }
  }

  async function send(body: string): Promise<void> {
    const conv = conversation.value
    const text = body.trim()
    if (!conv || !text || isSending.value || conv.readOnly) return
    isSending.value = true
    error.value = null
    try {
      const { $firebaseFirestore, $firebaseAuth } = useNuxtApp()
      const uid = $firebaseAuth?.currentUser?.uid ?? currentUid.value
      const chat = firestoreChatService($firebaseFirestore)
      await chat.sendText(conv.firestoreConversationId, uid, text)
      // Best-effort: refresh the inbox preview; non-blocking.
      await convSvc.updateLastMessage(conversationId, text).catch(() => {})
    } catch {
      error.value = "Impossible d'envoyer le message. Veuillez réessayer."
    } finally {
      isSending.value = false
    }
  }

  function stop(): void {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  onUnmounted(stop)

  return { conversation, messages, currentUid, isLoading, isSending, error, start, send, stop }
}
