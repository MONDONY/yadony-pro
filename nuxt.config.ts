export default defineNuxtConfig({
  compatibilityDate: '2026-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  typescript: {
    strict: true,
    typeCheck: false,
  },
  ssr: false,
  app: {
    head: {
      title: 'dony PRO',
      htmlAttrs: { lang: 'fr', class: 'dark' },
    },
  },
})
