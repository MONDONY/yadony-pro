<!-- app/pages/negociations/[id].vue -->
<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, AlertCircle } from 'lucide-vue-next'
import { useNegotiationDetail } from '@/features/negociations/composables/useNegotiationDetail'
import NegotiationMessageBubble from '@/features/negociations/components/NegotiationMessageBubble.vue'
import NegotiationCounterModal from '@/features/negociations/components/NegotiationCounterModal.vue'
import NegotiationSubmitTripModal from '@/features/negociations/components/NegotiationSubmitTripModal.vue'
import type { CounterPayload } from '@/features/negociations/types'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Négociation',
  pageSubtitle: 'Détail de la négociation',
})

const route = useRoute()
const router = useRouter()
const threadId = route.params.id as string

const { thread, isLoading, actionLoading, error, fetchThread, submitCounter, rejectThread, linkTrip } =
  useNegotiationDetail(threadId)

onMounted(() => fetchThread())

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'En cours',
  AWAITING_TRIP: 'Trajet à lier',
  AWAITING_PAYMENT: 'En attente paiement',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  AUTO_REJECTED: 'Non retenue',
  EXPIRED: 'Expirée',
}

const STATUS_CLASS: Record<string, string> = {
  OPEN: 'bg-blue-500/15 text-blue-400',
  AWAITING_TRIP: 'bg-amber-500/15 text-amber-400',
  AWAITING_PAYMENT: 'bg-purple-500/15 text-purple-400',
  ACCEPTED: 'bg-green-500/15 text-green-400',
  REJECTED: 'bg-red-500/15 text-red-400',
  AUTO_REJECTED: 'bg-border text-text-muted',
  EXPIRED: 'bg-border text-text-muted',
}

const isMyTurn = computed(() => {
  if (!thread.value || thread.value.status !== 'OPEN') return false
  const msgs = thread.value.messages
  if (msgs.length === 0) return false
  const last = msgs[msgs.length - 1]
  return last.fromUserId !== thread.value.travelerId
})

const showCounterModal = ref(false)
const showSubmitTripModal = ref(false)
const showRejectConfirm = ref(false)

async function onCounter(price: number, body?: string) {
  await submitCounter({ proposedPriceEur: price, body } as CounterPayload)
  showCounterModal.value = false
}

async function onReject() {
  await rejectThread()
  showRejectConfirm.value = false
}

async function onLinkTrip(announcementId: string) {
  await linkTrip(announcementId)
  showSubmitTripModal.value = false
}

const messagesEl = ref<HTMLElement | null>(null)
watch(() => thread.value?.messages.length, async () => {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
})
</script>

<template>
  <div class="flex flex-col h-full max-h-[calc(100vh-120px)]">

    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>

    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center text-center py-16">
      <AlertCircle class="w-8 h-8 text-red-400 mb-2" />
      <p class="text-red-400 font-medium">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 rounded-btn border border-border text-sm text-text-muted hover:text-text"
        @click="fetchThread()"
      >
        Réessayer
      </button>
    </div>

    <template v-else-if="thread">
      <!-- Header -->
      <div class="flex-shrink-0 flex items-center gap-3 pb-4 border-b border-border mb-4">
        <button
          class="p-1.5 rounded-btn hover:bg-surface transition-colors text-text-muted hover:text-text"
          @click="router.push('/negociations')"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-text text-sm truncate">
            {{ thread.departureCity }} → {{ thread.arrivalCity }}
          </p>
          <p class="text-xs text-text-muted">{{ thread.weightKg }} kg</p>
        </div>
        <span
          :class="['flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full', STATUS_CLASS[thread.status] ?? 'bg-border text-text-muted']"
        >
          {{ STATUS_LABEL[thread.status] ?? thread.status }}
        </span>
      </div>

      <!-- Prix courant -->
      <div class="flex-shrink-0 flex items-center gap-3 mb-4 px-1">
        <div class="bg-surface border border-border rounded-btn px-4 py-2 text-center">
          <p class="text-xs text-text-muted">Prix actuel</p>
          <p class="text-xl font-bold text-accent">{{ thread.currentPriceEur }} €</p>
        </div>
        <div class="bg-surface border border-border rounded-btn px-4 py-2 text-center">
          <p class="text-xs text-text-muted">Échanges</p>
          <p class="text-xl font-bold text-text">{{ thread.roundsCount }}</p>
        </div>
        <div class="bg-surface border border-border rounded-btn px-4 py-2 text-center">
          <p class="text-xs text-text-muted">Prix/kg</p>
          <p class="text-xl font-bold text-text">{{ (thread.currentPriceEur / thread.weightKg).toFixed(2) }} €</p>
        </div>
      </div>

      <!-- Messages -->
      <div ref="messagesEl" class="flex-1 overflow-y-auto space-y-4 px-1 pb-4">
        <NegotiationMessageBubble
          v-for="msg in thread.messages"
          :key="msg.id"
          :message="msg"
          :is-mine="msg.fromUserId === thread.travelerId"
        />
        <p
          v-if="thread.messages.length === 0"
          class="text-center text-sm text-text-muted py-8"
        >
          Aucun message pour l'instant.
        </p>
      </div>

      <!-- Zone d'actions -->
      <div class="flex-shrink-0 border-t border-border pt-4 space-y-2">

        <div v-if="thread.status === 'OPEN' && isMyTurn" class="flex gap-2">
          <button
            class="flex-1 h-10 rounded-btn border border-border text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            :disabled="actionLoading"
            @click="showRejectConfirm = true"
          >
            Refuser
          </button>
          <button
            class="flex-1 h-10 rounded-btn bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            :disabled="actionLoading"
            @click="showCounterModal = true"
          >
            Contre-proposer
          </button>
        </div>

        <div
          v-else-if="thread.status === 'OPEN' && !isMyTurn"
          class="text-center text-sm text-text-muted py-2"
        >
          En attente de la réponse de l'expéditeur…
        </div>

        <div v-else-if="thread.status === 'AWAITING_TRIP'" class="space-y-2">
          <p class="text-xs text-amber-400 text-center font-medium">
            ⚠ L'expéditeur a accepté votre prix — liez un trajet pour continuer.
          </p>
          <button
            class="w-full h-10 rounded-btn bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
            :disabled="actionLoading"
            @click="showSubmitTripModal = true"
          >
            Lier un trajet actif
          </button>
        </div>

        <div v-else-if="thread.status === 'AWAITING_PAYMENT'" class="text-center text-sm text-text-muted py-2">
          En attente du paiement de l'expéditeur…
        </div>

        <div
          v-else
          class="text-center text-sm py-2"
          :class="thread.status === 'ACCEPTED' ? 'text-green-400' : 'text-text-muted'"
        >
          {{
            thread.status === 'ACCEPTED' ? '✓ Négociation acceptée — colis en route !' :
            thread.status === 'REJECTED' ? 'Négociation refusée.' :
            thread.status === 'AUTO_REJECTED' ? "L'expéditeur a choisi un autre voyageur." :
            'Négociation expirée.'
          }}
        </div>
      </div>
    </template>

    <!-- Modales -->
    <NegotiationCounterModal
      :open="showCounterModal"
      :current-price-eur="thread?.currentPriceEur ?? 0"
      :weight-kg="thread?.weightKg ?? 1"
      :is-loading="actionLoading"
      @close="showCounterModal = false"
      @submit="onCounter"
    />

    <NegotiationSubmitTripModal
      :open="showSubmitTripModal"
      :is-loading="actionLoading"
      @close="showSubmitTripModal = false"
      @submit="onLinkTrip"
    />

    <!-- Confirm reject -->
    <Teleport to="body">
      <div
        v-if="showRejectConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showRejectConfirm = false"
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div class="relative w-full max-w-sm bg-surface border border-border rounded-card shadow-2xl p-6 space-y-4">
          <h3 class="font-semibold text-text">Refuser cette négociation ?</h3>
          <p class="text-sm text-text-muted">Cette action est irréversible.</p>
          <div class="flex gap-2.5">
            <button
              class="flex-1 h-10 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
              @click="showRejectConfirm = false"
            >
              Annuler
            </button>
            <button
              :disabled="actionLoading"
              class="flex-1 flex items-center justify-center h-10 rounded-btn bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              data-test="confirm-reject-btn"
              @click="onReject"
            >
              <span v-if="actionLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span v-else>Refuser</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
