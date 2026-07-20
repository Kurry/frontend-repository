import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'
import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  components: true,
  modules: [
    '@pinia/nuxt',
    '@primevue/nuxt-module',
  ],
  css: ['~/assets/css/main.css'],
  primevue: {
    options: {
      theme: {
          preset: Aura
      }
    }
  },
  ssr: false,
  nitro: {
    preset: 'static'
  },
  vite: {
    plugins: [
      tailwindcss(),
    ]
  },
  compatibilityDate: '2024-04-03'
})
