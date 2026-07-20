import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import './style.css'
import { registerWebMCP } from './webmcp'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(MotionPlugin)

app.mount('#app')

// Register WebMCP after app and store mount so it can access Pinia
registerWebMCP()
