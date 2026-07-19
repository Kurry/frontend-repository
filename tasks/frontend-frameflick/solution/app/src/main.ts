import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'virtual:uno.css'
import App from './App.vue'
import { initWebMcp } from './scripts/webmcp'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')

// Expose the WebMCP surface once the app (and its Pinia stores) are live.
initWebMcp()
