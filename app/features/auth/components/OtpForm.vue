<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFirebaseAuth } from '@/features/auth/composables/useFirebaseAuth'

const props = defineProps<{ phone: string }>()
const code = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function submit() {
  error.value = null
  if (!/^\d{6}$/.test(code.value)) {
    error.value = 'Le code doit faire 6 chiffres'
    return
  }
  loading.value = true
  try {
    const { confirmOtp } = useFirebaseAuth()
    const user = await confirmOtp(code.value)
    if (!user.isProAccount) {
      await navigateTo('/upgrade')
      return
    }
    await navigateTo('/')
  }
  catch (e) {
    error.value = (e as Error).message || 'Code incorrect'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="w-full max-w-sm space-y-4" @submit.prevent="submit">
    <p class="text-sm text-text-muted">
      Code envoyé au <span class="text-text font-medium">{{ props.phone }}</span>
    </p>
    <Input v-model="code" inputmode="numeric" maxlength="6" placeholder="123456" :disabled="loading" />
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>
    <Button type="submit" class="w-full" :disabled="loading">
      {{ loading ? 'Vérification...' : 'Se connecter' }}
    </Button>
  </form>
</template>
