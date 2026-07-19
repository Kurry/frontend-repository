import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { initWebMcp } from './scripts/webmcp'
import 'virtual:uno.css'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')

// Register the WebMCP surface after Pinia is installed so the tools can reach
// the same store actions the visible UI controls use.
initWebMcp()
