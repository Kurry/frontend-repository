import React from 'react'
import ReactDOM from 'react-dom/client'
import '@carbon/styles/css/styles.css'
import './styles.css'
import App from './App'
import { registerWebMcpTools } from './webmcp'

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const animate = Element.prototype.animate
  Element.prototype.animate = function reducedMotionAnimate(
    keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
    options?: number | KeyframeAnimationOptions,
  ) {
    const reducedOptions = typeof options === 'number'
      ? 0.001
      : { ...options, duration: 0.001, iterations: 1 }
    return animate.call(this, keyframes, reducedOptions)
  }
}

registerWebMcpTools()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
