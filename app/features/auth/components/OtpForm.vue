<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import OtpInput from './OtpInput.vue'
import { useFirebaseAuth } from '@/features/auth/composables/useFirebaseAuth'
import { friendlyAuthError } from '@/features/auth/lib/friendlyAuthError'

const props = withDefaults(defineProps<{
  phone?: string
  email?: string
  mode?: 'phone' | 'email'
}>(), {
  mode: 'phone',
  phone: '',
  email: '',
})
const emit = defineEmits<{ resend: [] }>()

const { confirmOtp, confirmEmailOtp } = useFirebaseAuth()

const otpInput = ref<InstanceType<typeof OtpInput> | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const countdown = ref(60)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    if (countdown.value > 0) countdown.value--
    else if (timer) { clearInterval(timer); timer = null }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const contact = computed(() => props.mode === 'email' ? props.email : props.phone)
const channelLabel = computed(() => props.mode === 'email' ? 'email' : 'SMS')

async function submit(code: string) {
  if (loading.value) return
  error.value = null
  loading.value = true
  try {
    const user = props.mode === 'email'
      ? await confirmEmailOtp(props.email, code)
      : await confirmOtp(code)
    if (!user.isProAccount) {
      await navigateTo('/upgrade')
      return
    }
    await navigateTo('/cockpit')
  }
  catch (e) {
    error.value = friendlyAuthError(e, props.mode === 'email' ? 'confirm-email-otp' : 'confirm-phone-otp')
  }
  finally {
    loading.value = false
    if (error.value) otpInput.value?.reset()
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-muted">
      Code {{ channelLabel }} envoyé à
      <span class="font-semibold text-text">{{ contact }}</span>
    </p>

    <OtpInput ref="otpInput" :disabled="loading" @complete="submit" />

    <p v-if="error" class="text-xs text-danger" aria-live="polite">{{ error }}</p>

    <p class="text-xs text-subtle text-center">
      <span v-if="countdown > 0">Renvoyer le code dans {{ countdown }}s</span>
      <button
        v-else
        type="button"
        data-test="resend-btn"
        class="text-primary hover:underline"
        @click="emit('resend')"
      >
        Renvoyer le code
      </button>
    </p>
  </div>
</template>
