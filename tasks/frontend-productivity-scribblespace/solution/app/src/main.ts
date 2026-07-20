import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'
import './index.css'
import App from './App.vue';
import { registerWebMCP } from './webmcp';
registerWebMCP();



const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(MotionPlugin)

app.mount('#app')
