import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles.css'
import { useReleaseStore } from './stores/releases'
import { registerWebMCP } from './webmcp'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.mount('#app')
registerWebMCP(useReleaseStore(pinia))
