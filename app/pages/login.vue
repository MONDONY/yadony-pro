<script setup lang="ts">
import { ref } from 'vue'
import PhoneNumberForm from '@/features/auth/components/PhoneNumberForm.vue'
import OtpForm from '@/features/auth/components/OtpForm.vue'

definePageMeta({ layout: 'auth' })

const step = ref<'phone' | 'otp'>('phone')
const phone = ref('')

function onSent(p: string) {
  phone.value = p
  step.value = 'otp'
}
</script>

<template>
  <div class="w-full max-w-md bg-surface border border-border rounded-card p-8 space-y-6">
    <div class="text-center space-y-2">
      <h1 class="font-display text-3xl font-bold text-primary">dony PRO</h1>
      <p class="text-text-muted">Connecte-toi à ton espace voyageur professionnel</p>
    </div>
    <PhoneNumberForm v-if="step === 'phone'" @sent="onSent" />
    <OtpForm v-else :phone="phone" />
  </div>
</template>
