import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import App from './App.vue'
import { initWebMcp } from './scripts/webmcp'
import 'virtual:uno.css'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(autoAnimatePlugin)
app.mount('#app')

// Register the WebMCP surface after Pinia is installed so the tools can reach
// the same store actions the visible UI controls use.
initWebMcp()
