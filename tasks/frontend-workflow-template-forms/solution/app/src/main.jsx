import { createRoot } from 'react-dom/client'
import '@carbon/styles/css/styles.css'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <App />,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    window.setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }, 0)
  })
}
