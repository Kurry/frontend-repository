import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'
import './style.css'
import App from './App.vue'
import { registerWebMCP } from './webmcp.js'
import { useStore } from './store.js'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(MotionPlugin)
app.mount('#app')

const store = useStore()
registerWebMCP(store)
