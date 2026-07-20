import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import App from './App.vue'
import { useSidedockStore } from './stores/sidedock.js'
import { registerWebmcp } from './webmcp.js'
import './main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(autoAnimatePlugin)
app.mount('#app')

// Register the WebMCP surface against the live store, after Pinia is active.
registerWebmcp(useSidedockStore(pinia))
