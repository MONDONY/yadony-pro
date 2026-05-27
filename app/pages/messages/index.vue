<script setup lang="ts">
import { onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { useConversations } from '@/features/messagerie/composables/useConversations'
import ConversationListItem from '@/features/messagerie/components/ConversationListItem.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Messagerie',
  pageSubtitle: 'Tes conversations avec les expéditeurs',
})

const { conversations, isLoading, error, last, fetchFirstPage, loadMore, archive } = useConversations()

onMounted(() => {
  fetchFirstPage()
})
</script>

<template>
  <div class="max-w-2xl space-y-4">
    <p class="text-sm text-text-muted">
      Clique une conversation pour ouvrir le fil et discuter en temps réel.
    </p>

    <section class="bg-surface border border-border rounded-card p-3">
      <p v-if="error" class="py-2 px-3 text-sm text-danger" data-test="conv-error">{{ error }}</p>

      <div v-if="isLoading && conversations.length === 0" class="py-8 text-center text-sm text-text-muted" data-test="conv-loading">
        Chargement…
      </div>

      <p v-else-if="conversations.length === 0" class="py-8 text-center text-sm text-text-muted" data-test="conv-empty">
        Aucune conversation pour le moment.
      </p>

      <div v-else class="divide-y divide-border">
        <ConversationListItem
          v-for="c in conversations"
          :key="c.id"
          :conversation="c"
          @archive="archive"
        />
      </div>

      <div v-if="!last" class="pt-3 text-center">
        <Button type="button" variant="ghost" size="sm" data-test="conv-load-more" :disabled="isLoading" @click="loadMore">
          Charger plus
        </Button>
      </div>
    </section>
  </div>
</template>
