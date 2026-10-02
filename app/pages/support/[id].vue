<!-- app/pages/support/[id].vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { useSupportTicket } from '@/features/support/composables/useSupportTicket'
import { SUPPORT_STATUS_LABELS } from '@/features/support/types/index'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Support',
})

const route = useRoute()
const { ticket, isLoading, isSending, error, sendError, fetchTicket, send } =
  useSupportTicket(route.params.id as string)

const draft = ref('')

onMounted(fetchTicket)

async function onSend() {
  if (await send(draft.value)) draft.value = ''
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-3">
    <NuxtLink to="/support" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
      <ArrowLeft class="w-4 h-4" /> Support
    </NuxtLink>

    <p v-if="error" class="text-sm text-danger" data-test="ticket-error">{{ error }}</p>
    <div v-else-if="isLoading || !ticket" class="h-40 rounded-card bg-border animate-pulse" data-test="ticket-loading" />

    <div v-else class="bg-surface border border-border rounded-card overflow-hidden">
      <header class="border-b border-border px-4 py-3">
        <p class="font-medium text-text" data-test="ticket-subject">{{ ticket.subject }}</p>
        <p class="text-xs text-text-muted" data-test="ticket-status">
          {{ SUPPORT_STATUS_LABELS[ticket.status as keyof typeof SUPPORT_STATUS_LABELS] ?? ticket.status }}
        </p>
      </header>

      <ul class="space-y-3 px-4 py-4" data-test="ticket-messages">
        <li
          v-for="m in ticket.messages ?? []"
          :key="m.id"
          :class="['max-w-[85%] rounded-el px-3 py-2 text-sm', m.authorType === 'ADMIN' ? 'bg-surface-el text-text mr-auto' : 'bg-primary/10 text-text ml-auto']"
          :data-test="`msg-${m.authorType.toLowerCase()}`"
        >
          <p class="text-2xs text-text-subtle mb-0.5">
            {{ m.authorType === 'ADMIN' ? 'Équipe yadony' : 'Toi' }} · {{ formatDateTime(m.createdAt) }}
          </p>
          <p v-if="m.content" class="whitespace-pre-line">{{ m.content }}</p>
          <a
            v-for="a in m.attachments"
            :key="a.id"
            :href="a.url"
            target="_blank"
            rel="noopener noreferrer"
            class="block text-xs text-primary underline mt-1"
          >Pièce jointe</a>
        </li>
      </ul>

      <form v-if="ticket.status !== 'RESOLVED'" class="border-t border-border p-3 space-y-2" data-test="ticket-reply" @submit.prevent="onSend">
        <textarea
          v-model="draft"
          rows="3"
          maxlength="4000"
          placeholder="Ta réponse…"
          data-test="ticket-reply-input"
          class="w-full rounded-input border border-border-strong bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
        />
        <p v-if="sendError" class="text-xs text-danger" data-test="ticket-send-error">{{ sendError }}</p>
        <button
          type="submit"
          :disabled="isSending || !draft.trim()"
          data-test="ticket-reply-send"
          class="h-9 px-4 rounded-btn bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {{ isSending ? 'Envoi…' : 'Envoyer' }}
        </button>
      </form>
      <p v-else class="border-t border-border px-4 py-3 text-xs text-text-muted" data-test="ticket-resolved">
        Cette demande est résolue. Pour un autre problème, ouvre une nouvelle demande.
      </p>
    </div>
  </div>
</template>
