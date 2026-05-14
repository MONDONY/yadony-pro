export default defineNuxtConfig({
  compatibilityDate: '2026-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss'],
  typescript: {
    strict: true,
    typeCheck: false,
  },
  ssr: false,
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'dony PRO',
      htmlAttrs: { lang: 'fr', class: 'dark' },
    },
  },
})
