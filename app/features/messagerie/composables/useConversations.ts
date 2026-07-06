import { ref } from 'vue'
import { conversationsService } from '@/features/messagerie/services/conversationsService'
import type { Conversation } from '@/features/messagerie/types/index'

const PAGE_SIZE = 20

export function useConversations() {
  const conversations = ref<Conversation[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const page = ref(0)
  const last = ref(true)

  const svc = conversationsService()

  async function fetchFirstPage(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const result = await svc.list(0, PAGE_SIZE)
      conversations.value = result.content
      page.value = result.page
      last.value = result.last
    } catch {
      error.value = 'Impossible de charger tes conversations.'
    } finally {
      isLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (last.value || isLoading.value) return
    isLoading.value = true
    try {
      const result = await svc.list(page.value + 1, PAGE_SIZE)
      conversations.value = [...conversations.value, ...result.content]
      page.value = result.page
      last.value = result.last
    } catch {
      error.value = 'Impossible de charger plus de conversations.'
    } finally {
      isLoading.value = false
    }
  }

  async function archive(id: string): Promise<void> {
    try {
      await svc.archive(id)
      conversations.value = conversations.value.filter((c) => c.id !== id)
    } catch {
      error.value = 'Impossible d’archiver cette conversation.'
    }
  }

  return { conversations, isLoading, error, page, last, fetchFirstPage, loadMore, archive }
}
