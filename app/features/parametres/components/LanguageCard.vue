<!-- app/features/parametres/components/LanguageCard.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Languages } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { extractProblem, TECHNICAL_ERROR_PATTERN } from '@/lib/apiError'
import { languageService, type AppLanguage } from '@/features/parametres/services/languageService'

const auth = useAuthStore()
const svc = languageService()

const options: Array<{ value: AppLanguage; label: string }> = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

const current = computed<AppLanguage>(() => auth.user?.preferredLanguage === 'en' ? 'en' : 'fr')
const isSaving = ref(false)
const error = ref<string | null>(null)
const saved = ref(false)

async function choose(language: AppLanguage) {
  if (language === current.value || isSaving.value || !auth.user) return
  isSaving.value = true
  error.value = null
  saved.value = false
  try {
    const res = await svc.updateLanguage(language)
    auth.user = { ...auth.user, preferredLanguage: res.language }
    saved.value = true
  } catch (e) {
    const { detail } = extractProblem(e)
    error.value = detail && !TECHNICAL_ERROR_PATTERN.test(detail)
      ? detail
      : 'Impossible de changer la langue. Réessaie.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <section class="bg-surface border border-border rounded-card p-5 space-y-3" data-test="language-card">
    <header class="flex items-start gap-3">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-el text-text-muted">
        <Languages class="w-5 h-5" aria-hidden="true" />
      </span>
      <div>
        <h2 class="font-display font-semibold text-base text-text">Langue des messages</h2>
        <p class="text-sm text-text-muted">Notifications, e-mails, SMS et messages du serveur sont envoyés dans cette langue.</p>
      </div>
    </header>

    <div class="flex items-center gap-1 bg-surface-el border border-border rounded-btn p-1 w-fit" role="radiogroup" aria-label="Langue">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        role="radio"
        :aria-checked="current === opt.value"
        :data-test="`language-${opt.value}`"
        :disabled="isSaving"
        :class="[
          'px-3 h-8 rounded text-sm font-medium transition-colors disabled:opacity-60',
          current === opt.value ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text',
        ]"
        @click="choose(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <p v-if="saved" class="text-xs text-success" data-test="language-saved">Langue enregistrée.</p>
    <p v-if="error" class="text-xs text-danger" data-test="language-error">{{ error }}</p>
  </section>
</template>
