<!-- app/pages/login.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { Mail, Smartphone } from 'lucide-vue-next'
import EmailForm from '@/features/auth/components/EmailForm.vue'
import PhoneNumberForm from '@/features/auth/components/PhoneNumberForm.vue'
import OtpForm from '@/features/auth/components/OtpForm.vue'

definePageMeta({ layout: 'auth' })

type LoginMethod = 'phone' | 'email'

const step = ref<LoginMethod | 'otp'>('phone')
const method = ref<LoginMethod>('phone')
const contact = ref('')

function selectMethod(nextMethod: LoginMethod) {
  method.value = nextMethod
  step.value = nextMethod
  contact.value = ''
}

function onSent(value: string) {
  contact.value = value
  step.value = 'otp'
}

function handleBack() {
  if (step.value === 'otp') {
    step.value = method.value
  } else {
    navigateTo('/')
  }
}
</script>

<template>
  <div class="w-full max-w-md flex flex-col gap-6">
    <!-- Barre de navigation interne -->
    <div class="flex items-center justify-between">
      <button
        type="button"
        class="flex items-center gap-1.5 text-sm text-text-subtle hover:text-text transition-colors"
        @click="handleBack"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {{ step === 'otp' ? 'Changer de mode' : 'Accueil' }}
      </button>
    </div>

    <!-- Titre -->
    <div>
      <h1 class="font-display text-2xl font-extrabold text-text">
        {{ step === 'otp' ? 'Code de vérification' : 'Connexion' }}
      </h1>
      <p class="text-sm text-text-subtle mt-1">
        {{ step === 'otp'
          ? `Code envoyé à ${contact}`
          : 'Accède à ton espace voyageur professionnel' }}
      </p>
    </div>

    <div v-if="step !== 'otp'" class="grid grid-cols-2 gap-2 rounded-[12px] border border-border bg-surface-el p-1">
      <button
        type="button"
        class="flex h-10 items-center justify-center gap-2 rounded-[9px] text-sm font-semibold transition-colors"
        :class="method === 'phone' ? 'bg-primary text-on-primary shadow-card' : 'text-text-subtle hover:text-text'"
        @click="selectMethod('phone')"
      >
        <Smartphone class="h-4 w-4" :stroke-width="1.75" aria-hidden="true" />
        Téléphone
      </button>
      <button
        type="button"
        class="flex h-10 items-center justify-center gap-2 rounded-[9px] text-sm font-semibold transition-colors"
        :class="method === 'email' ? 'bg-primary text-on-primary shadow-card' : 'text-text-subtle hover:text-text'"
        @click="selectMethod('email')"
      >
        <Mail class="h-4 w-4" :stroke-width="1.75" aria-hidden="true" />
        Email
      </button>
    </div>

    <!-- Indicateur d'étapes -->
    <div>
      <div class="flex items-center gap-2">
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
          :class="step === 'otp' ? 'bg-success/20 text-success' : 'bg-primary text-on-primary'"
        >
          <svg v-if="step === 'otp'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span v-else>1</span>
        </div>
        <div
          class="flex-1 h-px transition-colors"
          :class="step === 'otp' ? 'bg-primary' : 'bg-border'"
        />
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors border"
          :class="step === 'otp'
            ? 'bg-primary text-on-primary border-primary'
            : 'bg-surface-el border-border text-text-subtle'"
        >
          2
        </div>
      </div>
      <div class="flex justify-between mt-1">
        <span class="text-[10px]" :class="step === 'otp' ? 'text-success' : 'text-primary'">
          {{ method === 'email' ? 'Email' : 'Téléphone' }}
        </span>
        <span class="text-[10px]" :class="step === 'otp' ? 'text-primary' : 'text-text-subtle'">
          {{ method === 'email' ? 'Code email' : 'Code SMS' }}
        </span>
      </div>
    </div>

    <!-- Formulaires -->
    <PhoneNumberForm v-if="step === 'phone'" @sent="onSent" />
    <EmailForm v-else-if="step === 'email'" @sent="onSent" />
    <OtpForm
      v-else
      :mode="method"
      :phone="method === 'phone' ? contact : ''"
      :email="method === 'email' ? contact : ''"
      @resend="step = method"
    />

    <!-- Message aide (mobile uniquement, étape phone) -->
    <p v-if="step !== 'otp'" class="text-xs text-text-subtle text-center lg:hidden">
      Pas encore de compte ?
      <a href="https://yadony.app" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
        Télécharge l'app yadony
      </a>
    </p>
  </div>
</template>
