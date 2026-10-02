<!-- app/pages/support/index.vue -->
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LifeBuoy, ChevronDown } from 'lucide-vue-next'
import { useSupportTickets } from '@/features/support/composables/useSupportTickets'
import {
  SUPPORT_CATEGORY_LABELS, SUPPORT_STATUS_LABELS, type SupportCategory,
} from '@/features/support/types/index'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Support',
  pageSubtitle: 'Contacter l’équipe yadony',
})

const router = useRouter()
const { tickets, faq, isLoading, isCreating, error, createError, fetchTickets, fetchFaq, createTicket } =
  useSupportTickets()

const form = reactive({ category: 'OTHER' as SupportCategory, subject: '', message: '' })
const showForm = ref(false)
const openFaq = ref<string | null>(null)

const canSubmit = computed(() => form.subject.trim().length > 0 && form.message.trim().length > 0 && !isCreating.value)

onMounted(() => {
  fetchTickets()
  fetchFaq()
})

async function submit() {
  if (!canSubmit.value) return
  const id = await createTicket({ category: form.category, subject: form.subject, message: form.message })
  if (id) await router.push(`/support/${id}`)
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const inputClass =
  'w-full rounded-input border border-border-strong bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-[border-color,box-shadow]'
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <!-- Questions fréquentes -->
    <section v-if="faq.length > 0" class="bg-surface border border-border rounded-card p-5 space-y-2" data-test="support-faq">
      <h2 class="font-display font-semibold text-base text-text">Questions fréquentes</h2>
      <ul class="divide-y divide-border">
        <li v-for="item in faq" :key="item.code" class="py-2">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-text"
            :aria-expanded="openFaq === item.code"
            :data-test="`faq-${item.code}`"
            @click="openFaq = openFaq === item.code ? null : item.code"
          >
            {{ item.question }}
            <ChevronDown :class="['w-4 h-4 shrink-0 text-text-muted transition-transform', openFaq === item.code && 'rotate-180']" />
          </button>
          <p v-if="openFaq === item.code" class="mt-2 whitespace-pre-line text-sm text-text-muted" :data-test="`faq-answer-${item.code}`">
            {{ item.answer }}
          </p>
        </li>
      </ul>
    </section>

    <!-- Nouvelle demande -->
    <section class="bg-surface border border-border rounded-card p-5 space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-display font-semibold text-base text-text">Mes demandes</h2>
        <button
          v-if="!showForm"
          type="button"
          data-test="support-new"
          class="h-9 px-4 rounded-btn bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors"
          @click="showForm = true"
        >
          Nouvelle demande
        </button>
      </div>

      <form v-if="showForm" class="space-y-3 rounded-el border border-border bg-surface-el p-4" data-test="support-form" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium text-text mb-1.5" for="sp-category">Sujet</label>
          <select id="sp-category" v-model="form.category" data-test="support-category" :class="inputClass">
            <option v-for="(label, value) in SUPPORT_CATEGORY_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-text mb-1.5" for="sp-subject">Titre</label>
          <input id="sp-subject" v-model="form.subject" maxlength="200" data-test="support-subject" :class="inputClass" />
        </div>
        <div>
          <label class="block text-sm font-medium text-text mb-1.5" for="sp-message">Message</label>
          <textarea id="sp-message" v-model="form.message" maxlength="4000" rows="5" data-test="support-message" :class="inputClass" />
        </div>
        <p v-if="createError" class="text-sm text-danger" data-test="support-create-error">{{ createError }}</p>
        <div class="flex gap-2">
          <button
            type="submit"
            :disabled="!canSubmit"
            data-test="support-submit"
            class="h-9 px-4 rounded-btn bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {{ isCreating ? 'Envoi…' : 'Envoyer' }}
          </button>
          <button type="button" class="h-9 px-3 text-sm text-text-muted hover:text-text" data-test="support-cancel" @click="showForm = false">Annuler</button>
        </div>
      </form>

      <p v-if="error" class="text-sm text-danger" data-test="support-error">{{ error }}</p>
      <div v-else-if="isLoading" class="space-y-2" data-test="support-loading">
        <div v-for="i in 3" :key="i" class="h-14 rounded-el bg-border animate-pulse" />
      </div>
      <div v-else-if="tickets.length === 0" class="flex flex-col items-center py-10 text-center" data-test="support-empty">
        <LifeBuoy class="w-8 h-8 text-text-subtle mb-2" />
        <p class="text-sm text-text-muted">Aucune demande pour l’instant.</p>
      </div>
      <ul v-else class="divide-y divide-border">
        <li v-for="t in tickets" :key="t.id">
          <NuxtLink :to="`/support/${t.id}`" class="flex items-start gap-3 py-3 hover:bg-surface-el -mx-2 px-2 rounded-el transition-colors" :data-test="`ticket-${t.id}`">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-text truncate">{{ t.subject }}</p>
              <p v-if="t.lastMessagePreview" class="text-xs text-text-muted truncate">
                <span v-if="t.lastMessageFromAdmin">Équipe yadony : </span>{{ t.lastMessagePreview }}
              </p>
              <p class="text-2xs text-text-subtle mt-0.5">
                {{ SUPPORT_STATUS_LABELS[t.status as keyof typeof SUPPORT_STATUS_LABELS] ?? t.status }}
                · {{ formatDate(t.lastMessageAt ?? t.createdAt) }}
              </p>
            </div>
            <span
              v-if="t.unreadCount > 0"
              class="shrink-0 rounded-full bg-primary px-2 py-0.5 text-2xs font-semibold text-on-primary"
              :data-test="`ticket-unread-${t.id}`"
            >{{ t.unreadCount }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
