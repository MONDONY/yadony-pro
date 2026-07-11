<!-- app/features/ratings/components/RatingPromptCard.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { Star } from 'lucide-vue-next'
import type { PendingRating } from '@/features/ratings/types/index'

const props = defineProps<{
  pending: PendingRating
  isSubmitting: boolean
}>()

const emit = defineEmits<{ submit: [bidId: string, stars: number, comment: string] }>()

const stars = ref(0)
const comment = ref('')

function submit() {
  if (stars.value < 1 || props.isSubmitting) return
  emit('submit', props.pending.bidId, stars.value, comment.value.trim())
}
</script>

<template>
  <section class="bg-surface border border-border rounded-card p-5 space-y-3" data-test="rating-prompt">
    <header>
      <h2 class="font-display font-semibold text-base text-text">Note ton expéditeur</h2>
      <p class="text-sm text-text-muted">
        Livraison terminée avec <span class="font-medium text-text">{{ pending.otherPartyName }}</span> — partage ton expérience.
      </p>
    </header>

    <div class="flex items-center gap-1">
      <button
        v-for="n in 5"
        :key="n"
        type="button"
        :data-test="`rating-star-${n}`"
        :aria-label="`${n} étoile${n > 1 ? 's' : ''}`"
        class="p-1 transition-transform hover:scale-110 motion-reduce:hover:scale-100"
        @click="stars = n"
      >
        <Star
          class="w-6 h-6 transition-colors"
          :class="n <= stars ? 'text-warning fill-warning' : 'text-border-strong'"
        />
      </button>
    </div>

    <textarea
      v-model="comment"
      rows="2"
      maxlength="200"
      placeholder="Un commentaire ? (optionnel)"
      data-test="rating-comment"
      class="w-full px-3 py-2 rounded-input bg-surface-el border border-border-strong text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors resize-none"
    />

    <button
      :disabled="stars < 1 || isSubmitting"
      data-test="rating-submit"
      class="h-9 px-4 rounded-btn bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      @click="submit"
    >
      {{ isSubmitting ? 'Envoi…' : 'Envoyer ma note' }}
    </button>
  </section>
</template>
