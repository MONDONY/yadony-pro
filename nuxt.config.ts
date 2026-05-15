export default defineNuxtConfig({
  compatibilityDate: '2026-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss', '@pinia/nuxt'],
  typescript: {
    strict: true,
    typeCheck: false,
  },
  ssr: true,
  css: ['~~/assets/css/main.css'],
  vite: {
    optimizeDeps: {
      include: ['firebase/app', 'firebase/auth', 'clsx', 'tailwind-merge', 'class-variance-authority', 'radix-vue', 'lucide-vue-next'],
    },
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: '',
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseAppId: '',
    },
  },
  app: {
    head: {
      title: 'dony PRO',
      htmlAttrs: { lang: 'fr', class: 'dark' },
    },
  },
})
