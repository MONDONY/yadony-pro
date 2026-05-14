<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFirebaseAuth } from '@/features/auth/composables/useFirebaseAuth'

const emit = defineEmits<{ sent: [phone: string] }>()
const phone = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function submit() {
  error.value = null
  if (!/^\+\d{8,15}$/.test(phone.value)) {
    error.value = 'Format attendu : +33612345678'
    return
  }
  loading.value = true
  try {
    const { sendOtp } = useFirebaseAuth()
    await sendOtp(phone.value, 'recaptcha-container')
    emit('sent', phone.value)
  }
  catch (e) {
    error.value = (e as Error).message || 'Erreur envoi OTP'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="w-full max-w-sm space-y-4" @submit.prevent="submit">
    <label class="block text-sm font-medium text-text">Numéro de téléphone</label>
    <Input v-model="phone" type="tel" placeholder="+33612345678" :disabled="loading" />
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>
    <Button type="submit" class="w-full" :disabled="loading">
      {{ loading ? 'Envoi...' : 'Recevoir le code' }}
    </Button>
    <div id="recaptcha-container" />
  </form>
</template>
