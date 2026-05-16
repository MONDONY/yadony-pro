# Login Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer la page `/login` en un split screen avec panneau gauche branding (mascotte `sécurisé.png` + messages de sécurité) et panneau droit formulaire (sélecteur pays, 6 cases OTP, indicateur d'étapes).

**Architecture:** 5 nouveaux/modifiés composants dans `app/features/auth/components/` + modification du layout `auth.vue` + modification de `login.vue`. Chaque composant a une responsabilité unique et est testé indépendamment avec Vitest + @vue/test-utils.

**Tech Stack:** Nuxt 3, Vue 3 Composition API (`<script setup>`), Tailwind CSS (classes utilitaires + CSS vars), Vitest + @vue/test-utils (happy-dom), lucide-vue-next pour les icônes.

---

## Structure des fichiers

```
app/
  layouts/
    auth.vue                                        ← MODIFIÉ : split screen
  pages/
    login.vue                                       ← MODIFIÉ : step indicator + back link + ThemeToggle
  features/
    auth/
      components/
        OtpInput.vue                                ← CRÉÉ : 6 cases individuelles + progress bar
        CountrySelector.vue                         ← CRÉÉ : dropdown 6 pays avec fermeture au clic extérieur
        LoginLeftPanel.vue                          ← CRÉÉ : logo + sécurisé.png + 3 items réassurance
        PhoneNumberForm.vue                         ← MODIFIÉ : CountrySelector + chips 4 pays
        OtpForm.vue                                 ← MODIFIÉ : OtpInput + countdown + emit resend

tests/
  components/
    OtpInput.spec.ts                                ← CRÉÉ
    CountrySelector.spec.ts                         ← CRÉÉ
    LoginLeftPanel.spec.ts                          ← CRÉÉ
    PhoneNumberForm.spec.ts                         ← CRÉÉ
    OtpForm.spec.ts                                 ← CRÉÉ
```

---

## Task 1 : `OtpInput.vue` — 6 cases individuelles

**Files:**
- Create: `app/features/auth/components/OtpInput.vue`
- Test: `tests/components/OtpInput.spec.ts`

- [ ] **Step 1 : Écrire les tests**

```ts
// tests/components/OtpInput.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import OtpInput from '@/features/auth/components/OtpInput.vue'

describe('OtpInput', () => {
  it('renders 6 input boxes', () => {
    const wrapper = mount(OtpInput)
    expect(wrapper.findAll('input')).toHaveLength(6)
  })

  it('emits complete when all 6 digits are filled via input events', async () => {
    const wrapper = mount(OtpInput)
    const inputs = wrapper.findAll('input')
    for (let i = 0; i < 6; i++) {
      await inputs[i].setValue(String(i + 1))
      await inputs[i].trigger('input')
    }
    expect(wrapper.emitted('complete')).toBeTruthy()
    expect(wrapper.emitted('complete')![0]).toEqual(['123456'])
  })

  it('does not emit complete when fewer than 6 digits', async () => {
    const wrapper = mount(OtpInput)
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('1')
    await inputs[0].trigger('input')
    expect(wrapper.emitted('complete')).toBeFalsy()
  })

  it('reset() clears all digits', async () => {
    const wrapper = mount(OtpInput)
    const inputs = wrapper.findAll('input')
    for (let i = 0; i < 6; i++) {
      await inputs[i].setValue(String(i + 1))
      await inputs[i].trigger('input')
    }
    await wrapper.vm.reset()
    const values = wrapper.findAll('input').map(i => (i.element as HTMLInputElement).value)
    expect(values.every(v => v === '')).toBe(true)
  })

  it('applies filled class when digit is present', async () => {
    const wrapper = mount(OtpInput)
    const first = wrapper.findAll('input')[0]
    await first.setValue('5')
    await first.trigger('input')
    expect(first.classes()).toContain('border-primary')
  })

  it('distributes pasted digits across all boxes', async () => {
    const wrapper = mount(OtpInput)
    const first = wrapper.findAll('input')[0]
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: new DataTransfer(),
    })
    pasteEvent.clipboardData!.setData('text/plain', '987654')
    await first.element.dispatchEvent(pasteEvent)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('complete')).toBeTruthy()
    expect(wrapper.emitted('complete')![0]).toEqual(['987654'])
  })

  it('disables all inputs when disabled prop is true', () => {
    const wrapper = mount(OtpInput, { props: { disabled: true } })
    const inputs = wrapper.findAll('input')
    inputs.forEach(input => {
      expect((input.element as HTMLInputElement).disabled).toBe(true)
    })
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
cd /home/a-diakite/Desktop/MyProject/my_app/dony-pro
npx vitest run tests/components/OtpInput.spec.ts
```
Attendu : FAIL — `Cannot find module '@/features/auth/components/OtpInput.vue'`

- [ ] **Step 3 : Créer `OtpInput.vue`**

```vue
<!-- app/features/auth/components/OtpInput.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ complete: [code: string] }>()

const digits = ref<string[]>(Array(6).fill(''))
const inputs = ref<HTMLInputElement[]>([])

function onInput(index: number, event: Event) {
  const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '')
  const value = raw.slice(-1)
  digits.value[index] = value
  if (value && index < 5) {
    inputs.value[index + 1]?.focus()
  }
  checkComplete()
}

function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    digits.value[index - 1] = ''
    inputs.value[index - 1]?.focus()
  }
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6) ?? ''
  for (let i = 0; i < 6; i++) {
    digits.value[i] = text[i] ?? ''
  }
  const lastFilled = Math.min(text.length, 5)
  inputs.value[lastFilled]?.focus()
  checkComplete()
}

function checkComplete() {
  const code = digits.value.join('')
  if (code.length === 6) emit('complete', code)
}

function reset() {
  digits.value = Array(6).fill('')
  inputs.value[0]?.focus()
}

defineExpose({ reset })
</script>

<template>
  <div>
    <div class="flex gap-2">
      <input
        v-for="(digit, i) in digits"
        :key="i"
        ref="inputs"
        type="text"
        inputmode="numeric"
        maxlength="1"
        :autocomplete="i === 0 ? 'one-time-code' : 'off'"
        :value="digit"
        :disabled="props.disabled"
        :aria-label="`Chiffre ${i + 1} sur 6`"
        class="w-10 h-12 text-center text-lg font-bold rounded-[10px] border bg-surface-el outline-none transition-colors focus:ring-2 focus:ring-primary/15"
        :class="digit ? 'border-primary text-text' : 'border-border text-subtle'"
        style="caret-color: var(--primary);"
        @input="onInput(i, $event)"
        @keydown="onKeydown(i, $event)"
        @paste="onPaste"
        @focus="($event.target as HTMLInputElement).select()"
      />
    </div>
    <div class="mt-2 h-0.5 rounded-full bg-border overflow-hidden">
      <div
        class="h-full rounded-full bg-primary transition-all duration-200"
        :style="{ width: `${(digits.filter(Boolean).length / 6) * 100}%` }"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npx vitest run tests/components/OtpInput.spec.ts
```
Attendu : PASS — 7 tests ✓

- [ ] **Step 5 : Commit**

```bash
git add app/features/auth/components/OtpInput.vue tests/components/OtpInput.spec.ts
git commit -m "feat(auth): add OtpInput component with 6 individual boxes"
```

---

## Task 2 : `CountrySelector.vue` — dropdown indicatifs pays

**Files:**
- Create: `app/features/auth/components/CountrySelector.vue`
- Test: `tests/components/CountrySelector.spec.ts`

- [ ] **Step 1 : Écrire les tests**

```ts
// tests/components/CountrySelector.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CountrySelector from '@/features/auth/components/CountrySelector.vue'

const defaultCountry = { code: 'FR', flag: '🇫🇷', name: 'France', dial: '+33' }

describe('CountrySelector', () => {
  it('shows selected country flag and dial code', () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
    })
    expect(wrapper.text()).toContain('🇫🇷')
    expect(wrapper.text()).toContain('+33')
  })

  it('opens dropdown on button click', async () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
    })
    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false)
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(true)
  })

  it('lists all 6 countries in dropdown', async () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
    })
    await wrapper.find('button').trigger('click')
    const items = wrapper.findAll('li[role="option"]')
    expect(items).toHaveLength(6)
  })

  it('emits update:modelValue when a country is selected', async () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
    })
    await wrapper.find('button').trigger('click')
    const items = wrapper.findAll('li[role="option"]')
    await items[1].trigger('click') // Sénégal
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')![0][0] as typeof defaultCountry
    expect(emitted.code).toBe('SN')
    expect(emitted.dial).toBe('+221')
  })

  it('closes dropdown after selection', async () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
    })
    await wrapper.find('button').trigger('click')
    await wrapper.findAll('li[role="option"]')[0].trigger('click')
    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false)
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
npx vitest run tests/components/CountrySelector.spec.ts
```
Attendu : FAIL — `Cannot find module`

- [ ] **Step 3 : Créer `CountrySelector.vue`**

```vue
<!-- app/features/auth/components/CountrySelector.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

export interface Country {
  code: string
  flag: string
  name: string
  dial: string
}

export const COUNTRIES: Country[] = [
  { code: 'FR', flag: '🇫🇷', name: 'France',        dial: '+33'  },
  { code: 'SN', flag: '🇸🇳', name: 'Sénégal',       dial: '+221' },
  { code: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire", dial: '+225' },
  { code: 'ML', flag: '🇲🇱', name: 'Mali',          dial: '+223' },
  { code: 'CM', flag: '🇨🇲', name: 'Cameroun',      dial: '+237' },
  { code: 'GN', flag: '🇬🇳', name: 'Guinée',        dial: '+224' },
]

const props = defineProps<{ modelValue: Country }>()
const emit = defineEmits<{ 'update:modelValue': [country: Country] }>()

const open = ref(false)
const container = ref<HTMLElement | null>(null)

function select(country: Country) {
  emit('update:modelValue', country)
  open.value = false
}

function handleClickOutside(e: MouseEvent) {
  if (container.value && !container.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div ref="container" class="relative">
    <button
      type="button"
      class="flex items-center gap-1.5 h-11 min-w-[92px] rounded-[10px] border border-border bg-surface-el px-3 text-sm font-semibold text-text hover:border-primary transition-colors"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click.stop="open = !open"
    >
      <span>{{ props.modelValue.flag }}</span>
      <span>{{ props.modelValue.dial }}</span>
      <ChevronDown class="w-3 h-3 text-subtle ml-auto" :class="{ 'rotate-180': open }" />
    </button>

    <ul
      v-if="open"
      role="listbox"
      class="absolute top-full left-0 mt-1 z-50 bg-surface border border-border rounded-card shadow-xl py-1 min-w-[200px]"
    >
      <li
        v-for="country in COUNTRIES"
        :key="country.code"
        role="option"
        :aria-selected="country.code === props.modelValue.code"
        class="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-surface-el transition-colors"
        :class="country.code === props.modelValue.code ? 'text-primary font-semibold' : 'text-text'"
        @click="select(country)"
      >
        <span>{{ country.flag }}</span>
        <span>{{ country.name }}</span>
        <span class="ml-auto text-subtle text-xs">{{ country.dial }}</span>
      </li>
    </ul>
  </div>
</template>
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npx vitest run tests/components/CountrySelector.spec.ts
```
Attendu : PASS — 5 tests ✓

- [ ] **Step 5 : Commit**

```bash
git add app/features/auth/components/CountrySelector.vue tests/components/CountrySelector.spec.ts
git commit -m "feat(auth): add CountrySelector component with 6 country dial codes"
```

---

## Task 3 : `PhoneNumberForm.vue` — sélecteur pays + chips

**Files:**
- Modify: `app/features/auth/components/PhoneNumberForm.vue`
- Test: `tests/components/PhoneNumberForm.spec.ts`

- [ ] **Step 1 : Écrire les tests**

```ts
// tests/components/PhoneNumberForm.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PhoneNumberForm from '@/features/auth/components/PhoneNumberForm.vue'

const sendOtpMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@/features/auth/composables/useFirebaseAuth', () => ({
  useFirebaseAuth: () => ({ sendOtp: sendOtpMock }),
}))

describe('PhoneNumberForm', () => {
  beforeEach(() => { sendOtpMock.mockClear() })

  it('renders country selector button with default FR', () => {
    const wrapper = mount(PhoneNumberForm)
    expect(wrapper.text()).toContain('+33')
    expect(wrapper.text()).toContain('🇫🇷')
  })

  it('renders 4 quick country chips', () => {
    const wrapper = mount(PhoneNumberForm)
    const chips = wrapper.findAll('[data-test="country-chip"]')
    expect(chips).toHaveLength(4)
  })

  it('clicking SN chip switches dial code to +221', async () => {
    const wrapper = mount(PhoneNumberForm)
    const chips = wrapper.findAll('[data-test="country-chip"]')
    await chips[1].trigger('click') // Sénégal
    expect(wrapper.text()).toContain('+221')
  })

  it('shows error when local number is empty on submit', async () => {
    const wrapper = mount(PhoneNumberForm)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Numéro invalide')
    expect(sendOtpMock).not.toHaveBeenCalled()
  })

  it('shows error when local number has fewer than 7 digits', async () => {
    const wrapper = mount(PhoneNumberForm)
    await wrapper.find('input[type="tel"]').setValue('123')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Numéro invalide')
  })

  it('calls sendOtp with concatenated dial+local and emits sent', async () => {
    const wrapper = mount(PhoneNumberForm)
    await wrapper.find('input[type="tel"]').setValue('612345678')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(sendOtpMock).toHaveBeenCalledWith('+33612345678', 'recaptcha-container')
    expect(wrapper.emitted('sent')).toBeTruthy()
    expect(wrapper.emitted('sent')![0]).toEqual(['+33612345678'])
  })

  it('calls sendOtp with SN dial code when SN chip selected', async () => {
    const wrapper = mount(PhoneNumberForm)
    const chips = wrapper.findAll('[data-test="country-chip"]')
    await chips[1].trigger('click') // Sénégal +221
    await wrapper.find('input[type="tel"]').setValue('771234567')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(sendOtpMock).toHaveBeenCalledWith('+221771234567', 'recaptcha-container')
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
npx vitest run tests/components/PhoneNumberForm.spec.ts
```
Attendu : FAIL — tests sur les chips/selector inexistants

- [ ] **Step 3 : Réécrire `PhoneNumberForm.vue`**

```vue
<!-- app/features/auth/components/PhoneNumberForm.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import CountrySelector, { type Country, COUNTRIES } from './CountrySelector.vue'
import { useFirebaseAuth } from '@/features/auth/composables/useFirebaseAuth'

const QUICK_COUNTRIES = COUNTRIES.slice(0, 4) // FR, SN, CI, ML

const emit = defineEmits<{ sent: [phone: string] }>()

const country = ref<Country>(COUNTRIES[0])
const localNumber = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const fullPhone = computed(
  () => `${country.value.dial}${localNumber.value.replace(/[\s\-]/g, '')}`,
)

async function submit() {
  error.value = null
  if (!/^\+\d{8,15}$/.test(fullPhone.value)) {
    error.value = 'Numéro invalide — ex : 6 12 34 56 78'
    return
  }
  loading.value = true
  try {
    const { sendOtp } = useFirebaseAuth()
    await sendOtp(fullPhone.value, 'recaptcha-container')
    emit('sent', fullPhone.value)
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
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <div>
      <label class="block text-xs font-semibold text-muted mb-2">Numéro de téléphone</label>
      <div class="flex gap-2">
        <CountrySelector v-model="country" />
        <input
          v-model="localNumber"
          type="tel"
          inputmode="numeric"
          placeholder="6 12 34 56 78"
          :disabled="loading"
          class="flex-1 h-11 rounded-[10px] border bg-surface-el px-4 text-sm text-text placeholder:text-subtle outline-none focus:border-primary transition-colors"
          :class="error ? 'border-danger' : 'border-border'"
        />
      </div>
      <div class="flex gap-2 flex-wrap mt-2">
        <button
          v-for="c in QUICK_COUNTRIES"
          :key="c.code"
          type="button"
          data-test="country-chip"
          class="flex items-center gap-1.5 h-7 px-2.5 rounded-[7px] border text-xs font-medium transition-colors"
          :class="c.code === country.code
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border text-subtle hover:border-primary/30 hover:text-text'"
          @click="country = c"
        >
          {{ c.flag }} {{ c.name }}
        </button>
      </div>
    </div>

    <p v-if="error" class="text-xs text-danger" aria-live="polite">{{ error }}</p>

    <button
      type="submit"
      :disabled="loading"
      class="h-11 rounded-btn bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-50"
    >
      {{ loading ? 'Envoi en cours...' : 'Recevoir le code par SMS →' }}
    </button>

    <div id="recaptcha-container" />
  </form>
</template>
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npx vitest run tests/components/PhoneNumberForm.spec.ts
```
Attendu : PASS — 7 tests ✓

- [ ] **Step 5 : Commit**

```bash
git add app/features/auth/components/PhoneNumberForm.vue tests/components/PhoneNumberForm.spec.ts
git commit -m "feat(auth): rework PhoneNumberForm with country selector and quick chips"
```

---

## Task 4 : `OtpForm.vue` — utilise OtpInput + countdown

**Files:**
- Modify: `app/features/auth/components/OtpForm.vue`
- Test: `tests/components/OtpForm.spec.ts`

- [ ] **Step 1 : Écrire les tests**

```ts
// tests/components/OtpForm.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import OtpForm from '@/features/auth/components/OtpForm.vue'

const navigateToMock = vi.fn()
vi.stubGlobal('navigateTo', navigateToMock)

const confirmOtpMock = vi.fn()
vi.mock('@/features/auth/composables/useFirebaseAuth', () => ({
  useFirebaseAuth: () => ({ confirmOtp: confirmOtpMock }),
}))

vi.mock('@/features/auth/components/OtpInput.vue', () => ({
  default: {
    name: 'OtpInput',
    template: '<div data-test="otp-input" />',
    emits: ['complete'],
    expose: ['reset'],
    setup() { return { reset: vi.fn() } },
  },
}))

describe('OtpForm', () => {
  beforeEach(() => {
    navigateToMock.mockClear()
    confirmOtpMock.mockClear()
  })

  it('shows the phone number passed as prop', () => {
    const wrapper = mount(OtpForm, { props: { phone: '+33612345678' } })
    expect(wrapper.text()).toContain('+33612345678')
  })

  it('shows countdown timer', () => {
    const wrapper = mount(OtpForm, { props: { phone: '+33612345678' } })
    expect(wrapper.text()).toMatch(/\d+s/)
  })

  it('calls confirmOtp when OtpInput emits complete', async () => {
    confirmOtpMock.mockResolvedValue({ isProAccount: true })
    const wrapper = mount(OtpForm, { props: { phone: '+33612345678' } })
    await wrapper.findComponent({ name: 'OtpInput' }).vm.$emit('complete', '123456')
    await wrapper.vm.$nextTick()
    expect(confirmOtpMock).toHaveBeenCalledWith('123456')
  })

  it('navigates to /cockpit after successful pro login', async () => {
    confirmOtpMock.mockResolvedValue({ isProAccount: true })
    const wrapper = mount(OtpForm, { props: { phone: '+33612345678' } })
    await wrapper.findComponent({ name: 'OtpInput' }).vm.$emit('complete', '123456')
    await wrapper.vm.$nextTick()
    expect(navigateToMock).toHaveBeenCalledWith('/cockpit')
  })

  it('navigates to /upgrade when user is not pro', async () => {
    confirmOtpMock.mockResolvedValue({ isProAccount: false })
    const wrapper = mount(OtpForm, { props: { phone: '+33612345678' } })
    await wrapper.findComponent({ name: 'OtpInput' }).vm.$emit('complete', '999999')
    await wrapper.vm.$nextTick()
    expect(navigateToMock).toHaveBeenCalledWith('/upgrade')
  })

  it('shows error message on confirmOtp failure', async () => {
    confirmOtpMock.mockRejectedValue(new Error('Code incorrect'))
    const wrapper = mount(OtpForm, { props: { phone: '+33612345678' } })
    await wrapper.findComponent({ name: 'OtpInput' }).vm.$emit('complete', '000000')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Code incorrect')
  })

  it('emits resend when resend button clicked (countdown at 0)', async () => {
    const wrapper = mount(OtpForm, { props: { phone: '+33612345678' } })
    await wrapper.vm.$forceUpdate()
    // Forcer countdown à 0
    ;(wrapper.vm as unknown as { countdown: number }).countdown = 0
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('[data-test="resend-btn"]')
    if (btn.exists()) {
      await btn.trigger('click')
      expect(wrapper.emitted('resend')).toBeTruthy()
    }
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
npx vitest run tests/components/OtpForm.spec.ts
```
Attendu : plusieurs FAIL car le composant actuel n'utilise pas OtpInput

- [ ] **Step 3 : Réécrire `OtpForm.vue`**

```vue
<!-- app/features/auth/components/OtpForm.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import OtpInput from './OtpInput.vue'
import { useFirebaseAuth } from '@/features/auth/composables/useFirebaseAuth'

const props = defineProps<{ phone: string }>()
const emit = defineEmits<{ resend: [] }>()

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

async function submit(code: string) {
  error.value = null
  loading.value = true
  try {
    const { confirmOtp } = useFirebaseAuth()
    const user = await confirmOtp(code)
    if (!user.isProAccount) {
      await navigateTo('/upgrade')
      return
    }
    await navigateTo('/cockpit')
  }
  catch (e) {
    error.value = (e as Error).message || 'Code incorrect'
    otpInput.value?.reset()
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-muted">
      Code envoyé au <span class="font-semibold text-text">{{ props.phone }}</span>
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
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npx vitest run tests/components/OtpForm.spec.ts
```
Attendu : PASS — 7 tests ✓

- [ ] **Step 5 : Commit**

```bash
git add app/features/auth/components/OtpForm.vue tests/components/OtpForm.spec.ts
git commit -m "feat(auth): rework OtpForm to use OtpInput component with countdown"
```

---

## Task 5 : `LoginLeftPanel.vue` — panneau branding + sécurité

**Files:**
- Create: `app/features/auth/components/LoginLeftPanel.vue`
- Test: `tests/components/LoginLeftPanel.spec.ts`

- [ ] **Step 1 : Écrire les tests**

```ts
// tests/components/LoginLeftPanel.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginLeftPanel from '@/features/auth/components/LoginLeftPanel.vue'

describe('LoginLeftPanel', () => {
  it('renders the dony logo text', () => {
    const wrapper = mount(LoginLeftPanel)
    expect(wrapper.text()).toContain('dony')
  })

  it('renders the PRO badge', () => {
    const wrapper = mount(LoginLeftPanel)
    expect(wrapper.text()).toContain('PRO')
  })

  it('renders the securise mascot image', () => {
    const wrapper = mount(LoginLeftPanel)
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/mascots/securise.png')
  })

  it('renders 3 security reassurance items', () => {
    const wrapper = mount(LoginLeftPanel)
    const items = wrapper.findAll('[data-test="security-item"]')
    expect(items).toHaveLength(3)
  })

  it('mentions Stripe in the first security item', () => {
    const wrapper = mount(LoginLeftPanel)
    const items = wrapper.findAll('[data-test="security-item"]')
    expect(items[0].text()).toContain('Stripe')
  })

  it('mentions KYC in the second security item', () => {
    const wrapper = mount(LoginLeftPanel)
    const items = wrapper.findAll('[data-test="security-item"]')
    expect(items[1].text()).toContain('KYC')
  })

  it('mentions SMS in the third security item', () => {
    const wrapper = mount(LoginLeftPanel)
    const items = wrapper.findAll('[data-test="security-item"]')
    expect(items[2].text()).toContain('SMS')
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
npx vitest run tests/components/LoginLeftPanel.spec.ts
```
Attendu : FAIL — `Cannot find module`

- [ ] **Step 3 : Créer `LoginLeftPanel.vue`**

```vue
<!-- app/features/auth/components/LoginLeftPanel.vue -->
<script setup lang="ts">
const items = [
  {
    icon: '🔒',
    iconStyle: 'background:rgb(var(--primary-rgb)/0.12);',
    title: 'Paiements sécurisés via Stripe',
    subtitle: 'Fonds en séquestre jusqu\'à la livraison confirmée',
  },
  {
    icon: '✓',
    iconStyle: 'background:rgb(var(--success-rgb)/0.12);color:var(--success);',
    title: 'Identité vérifiée (KYC)',
    subtitle: 'Tous les membres sont validés avant d\'accéder à la plateforme',
  },
  {
    icon: '📱',
    iconStyle: 'background:rgb(var(--accent-rgb)/0.12);',
    title: 'Connexion par code SMS',
    subtitle: 'Sans mot de passe — plus simple, plus sûr',
  },
]
</script>

<template>
  <div class="w-[420px] shrink-0 bg-bg border-r border-border flex flex-col p-8 relative overflow-hidden">
    <!-- Glow blobs -->
    <div
      aria-hidden="true"
      class="absolute pointer-events-none"
      style="top:-60px;right:-60px;width:260px;height:260px;border-radius:50%;background:rgb(var(--primary-rgb)/0.10);filter:blur(60px);"
    />
    <div
      aria-hidden="true"
      class="absolute pointer-events-none"
      style="bottom:-40px;left:-40px;width:200px;height:200px;border-radius:50%;background:rgb(var(--accent-rgb)/0.07);filter:blur(50px);"
    />

    <!-- Logo -->
    <div class="relative flex items-center gap-2">
      <span class="font-display text-2xl font-extrabold text-text">dony</span>
      <span
        class="text-xs font-bold px-2.5 py-0.5 rounded-full border"
        style="background:rgb(var(--primary-rgb)/0.15);color:var(--primary);border-color:rgb(var(--primary-rgb)/0.3);"
      >PRO</span>
    </div>

    <!-- Mascotte -->
    <div class="relative flex-1 flex items-center justify-center py-6">
      <img
        src="/mascots/securise.png"
        alt="Mascotte dony avec bouclier de sécurité vérifié"
        class="w-48 h-48 object-contain"
      />
    </div>

    <!-- Items de réassurance -->
    <div class="relative flex flex-col gap-3">
      <div
        v-for="item in items"
        :key="item.title"
        data-test="security-item"
        class="flex items-center gap-3 p-3 rounded-card border border-border"
        style="background:rgb(var(--surface-rgb)/0.5);"
      >
        <div
          class="w-8 h-8 rounded-[8px] flex items-center justify-center text-sm shrink-0"
          :style="item.iconStyle"
        >{{ item.icon }}</div>
        <div>
          <p class="text-xs font-semibold text-text">{{ item.title }}</p>
          <p class="text-[11px] text-subtle leading-snug mt-0.5">{{ item.subtitle }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npx vitest run tests/components/LoginLeftPanel.spec.ts
```
Attendu : PASS — 7 tests ✓

- [ ] **Step 5 : Commit**

```bash
git add app/features/auth/components/LoginLeftPanel.vue tests/components/LoginLeftPanel.spec.ts
git commit -m "feat(auth): add LoginLeftPanel with mascot and security reassurance"
```

---

## Task 6 : `auth.vue` layout — split screen

**Files:**
- Modify: `app/layouts/auth.vue`

Pas de logique complexe — modification purement visuelle. Pas de test unitaire pour les layouts (couvert par les tests e2e existants).

- [ ] **Step 1 : Réécrire `auth.vue`**

```vue
<!-- app/layouts/auth.vue -->
<script setup lang="ts">
import LoginLeftPanel from '@/features/auth/components/LoginLeftPanel.vue'
</script>

<template>
  <div class="min-h-screen flex bg-bg">
    <LoginLeftPanel class="hidden lg:flex" />
    <div class="flex-1 flex items-center justify-center px-6 py-12">
      <slot />
    </div>
  </div>
</template>
```

- [ ] **Step 2 : Vérifier visuellement**

Lancer le serveur de développement :
```bash
npm run dev
```
Ouvrir http://localhost:3000/login et vérifier :
- ✓ Panneau gauche visible (logo + mascotte + 3 items) sur écran ≥ 1024px
- ✓ Panneau gauche masqué sur écran < 1024px (resize)
- ✓ Fond `--bg` correct en dark et light mode

- [ ] **Step 3 : Commit**

```bash
git add app/layouts/auth.vue
git commit -m "feat(auth): split screen layout with LoginLeftPanel"
```

---

## Task 7 : `login.vue` — step indicator, back link, ThemeToggle

**Files:**
- Modify: `app/pages/login.vue`

- [ ] **Step 1 : Réécrire `login.vue`**

```vue
<!-- app/pages/login.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import PhoneNumberForm from '@/features/auth/components/PhoneNumberForm.vue'
import OtpForm from '@/features/auth/components/OtpForm.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'

definePageMeta({ layout: 'auth' })

const step = ref<'phone' | 'otp'>('phone')
const phone = ref('')

function onSent(p: string) {
  phone.value = p
  step.value = 'otp'
}
</script>

<template>
  <div class="w-full max-w-md flex flex-col gap-6">
    <!-- Barre de navigation interne -->
    <div class="flex items-center justify-between">
      <button
        type="button"
        class="flex items-center gap-1.5 text-sm text-subtle hover:text-text transition-colors"
        @click="step === 'otp' ? (step = 'phone') : navigateTo('/')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {{ step === 'otp' ? 'Changer de numéro' : 'Accueil' }}
      </button>
      <ThemeToggle />
    </div>

    <!-- Titre -->
    <div>
      <h1 class="font-display text-2xl font-extrabold text-text">
        {{ step === 'phone' ? 'Connexion' : 'Code de vérification' }}
      </h1>
      <p class="text-sm text-subtle mt-1">
        {{ step === 'phone'
          ? 'Accède à ton espace voyageur professionnel'
          : `Code envoyé au ${phone}` }}
      </p>
    </div>

    <!-- Indicateur d'étapes -->
    <div>
      <div class="flex items-center gap-2">
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
          :class="step === 'otp' ? 'bg-success/20 text-success' : 'bg-primary text-white'"
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
            ? 'bg-primary text-white border-primary'
            : 'bg-surface-el border-border text-subtle'"
        >
          2
        </div>
      </div>
      <div class="flex justify-between mt-1">
        <span class="text-[10px]" :class="step === 'otp' ? 'text-success' : 'text-primary'">Téléphone</span>
        <span class="text-[10px]" :class="step === 'otp' ? 'text-primary' : 'text-subtle'">Code SMS</span>
      </div>
    </div>

    <!-- Formulaires -->
    <PhoneNumberForm v-if="step === 'phone'" @sent="onSent" />
    <OtpForm v-else :phone="phone" @resend="step = 'phone'" />

    <!-- Message aide (mobile uniquement, étape phone) -->
    <p v-if="step === 'phone'" class="text-xs text-subtle text-center lg:hidden">
      Pas encore de compte ?
      <a href="https://dony.app" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
        Télécharge l'app dony
      </a>
    </p>
  </div>
</template>
```

- [ ] **Step 2 : Vérifier visuellement les deux étapes**

```bash
npm run dev
```
Ouvrir http://localhost:3000/login et vérifier :

Étape 1 (téléphone) :
- ✓ Lien "← Accueil" visible, redirige vers `/`
- ✓ `ThemeToggle` visible en haut à droite
- ✓ Titre "Connexion", sous-titre correct
- ✓ Indicateur : point 1 bleu, ligne grise, point 2 gris
- ✓ Libellé "Téléphone" en primary, "Code SMS" en subtle
- ✓ Sélecteur pays + chips FR/SN/CI/ML + champ numéro
- ✓ Message app mobile visible sur mobile

Étape 2 (OTP) — après soumission d'un numéro :
- ✓ Lien "← Changer de numéro" visible, revient à l'étape 1
- ✓ Titre "Code de vérification", sous-titre avec le numéro saisi
- ✓ Indicateur : point 1 vert ✓, ligne bleue, point 2 bleu
- ✓ 6 cases OTP avec barre de progression
- ✓ Countdown "Renvoyer le code dans 60s"

- [ ] **Step 3 : Lancer la suite complète de tests**

```bash
npx vitest run --coverage
```
Attendu : tous les tests passent, couverture ≥ 90 %

- [ ] **Step 4 : Commit final**

```bash
git add app/pages/login.vue
git commit -m "feat(auth): redesign login page with split screen, step indicator, and theme toggle"
```

---

## Vérification finale

```bash
# Tous les tests unitaires/composants
npx vitest run

# Rapport de couverture
npx vitest run --coverage
# Ouvrir coverage/index.html — vérifier ≥ 90 % sur les fichiers auth

# Build de production (vérifie l'absence d'erreurs TypeScript)
npm run build
```
