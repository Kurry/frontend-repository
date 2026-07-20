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

// Decorative Phosphor SVG icons carry no accessible name (their controls are
// labelled by adjacent text or an aria-label on the wrapper). Mark them hidden
// from assistive tech so they are never announced as unlabelled graphics.
function hideDecorativeSvgs(root) {
  const scope = root && root.querySelectorAll ? root : document
  scope.querySelectorAll('svg:not([aria-hidden]):not([aria-label]):not([role="img"])').forEach((svg) => {
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('focusable', 'false')
  })
}
hideDecorativeSvgs(document)
const svgObserver = new MutationObserver(() => hideDecorativeSvgs(document))
svgObserver.observe(document.body, { childList: true, subtree: true })
