<script setup lang="ts">
import { computed, ref } from 'vue'
import { Mail } from 'lucide-vue-next'
import { useFirebaseAuth } from '@/features/auth/composables/useFirebaseAuth'

const emit = defineEmits<{ sent: [email: string] }>()

const email = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const normalizedEmail = computed(() => email.value.trim().toLowerCase())
const isValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail.value))

const { sendEmailOtp } = useFirebaseAuth()

async function submit() {
  if (loading.value) return
  error.value = null
  if (!isValid.value) {
    error.value = 'Adresse email invalide'
    return
  }
  loading.value = true
  try {
    await sendEmailOtp(normalizedEmail.value)
    emit('sent', normalizedEmail.value)
  } catch (e) {
    error.value = (e as Error).message || 'Erreur envoi OTP email'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <div>
      <label class="block text-xs font-semibold text-muted mb-2" for="email-login">
        Adresse email
      </label>
      <div class="relative">
        <Mail class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" :stroke-width="1.75" />
        <input
          id="email-login"
          v-model="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="exemple@email.com"
          :disabled="loading"
          class="h-11 w-full rounded-[10px] border bg-surface-el pl-10 pr-4 text-sm text-text placeholder:text-subtle outline-none transition-colors focus:border-primary"
          :class="error ? 'border-danger' : 'border-border'"
        />
      </div>
    </div>

    <p v-if="error" class="text-xs text-danger" aria-live="polite">{{ error }}</p>

    <button
      type="submit"
      :disabled="loading"
      class="flex h-11 items-center justify-center gap-2 rounded-btn bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-50"
    >
      {{ loading ? 'Envoi en cours...' : 'Recevoir le code par email ->' }}
    </button>
  </form>
</template>
