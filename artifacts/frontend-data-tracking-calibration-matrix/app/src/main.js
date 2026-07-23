import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './styles.css'
import App from './App.vue'
import { registerWebMcp } from './webmcp'

const pinia = createPinia()
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'meridian',
    themes: {
      meridian: {
        dark: false,
        colors: {
          primary: '#5b5bd6',
          secondary: '#0f766e',
          surface: '#ffffff',
          background: '#f4f6fa',
          error: '#b42318',
          warning: '#b54708',
          success: '#087a55',
        },
      },
    },
  },
  defaults: {
    VBtn: { rounded: 'lg' },
    VChip: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'compact', color: 'primary' },
    VTextarea: { variant: 'outlined', density: 'compact', color: 'primary' },
    VSelect: { variant: 'outlined', density: 'compact', color: 'primary' },
  },
})

const app = createApp(App)
app.use(pinia)
app.use(vuetify)
app.mount('#app')
registerWebMcp(pinia)
