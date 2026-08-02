export default defineNuxtConfig({
  compatibilityDate: '2026-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss', '@pinia/nuxt'],
  components: [
    // Le kit UI (~/components/ui) est importé explicitement via ses barrels
    // index.ts (convention shadcn-vue) — on l'exclut de l'auto-import pour
    // éviter les collisions de noms (Button, Card, Input…).
    { path: '~/components', pathPrefix: false, ignore: ['**/ui/**'] },
    { path: '~/features/landing/components', pathPrefix: false },
  ],
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
    baseURL: '/pro/',
    head: {
      title: 'yadony PRO',
      htmlAttrs: { lang: 'fr' },
      script: [
        {
          innerHTML: `(function(){var s=localStorage.getItem('yadony-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s===null&&d)){document.documentElement.classList.add('dark');}})();`,
          type: 'text/javascript',
          tagPosition: 'head',
        }
      ],
    },
  },
})
