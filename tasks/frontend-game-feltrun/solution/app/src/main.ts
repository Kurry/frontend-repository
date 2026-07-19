import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useGameStore } from './stores/game'
import { registerWebMcp } from './webmcp'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')

// Register the WebMCP surface against the live store (same actions the UI uses).
registerWebMcp(useGameStore())
