import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'
// Locally bundled variable fonts (no CDN): Space Grotesk for display,
// Public Sans for body, JetBrains Mono for code / metric surfaces.
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/public-sans'
import '@fontsource-variable/jetbrains-mono'
import App from './App.vue'
import './styles.css'

const app = createApp(App)
app.use(createPinia())
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: { darkModeSelector: '.app-dark', cssLayer: false },
  },
})
app.use(ToastService)
app.mount('#app')
