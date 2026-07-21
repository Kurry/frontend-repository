import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/cormorant-upright/400.css'
import '@fontsource/cormorant-upright/600.css'
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
