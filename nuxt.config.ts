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
  runtimeConfig: {
    public: {
      apiBaseUrl: '',
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        appId: '',
      },
    },
  },
  app: {
    head: {
      title: 'dony PRO',
      htmlAttrs: { lang: 'fr', class: 'dark' },
    },
  },
})
