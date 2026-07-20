import React from 'react'
import ReactDOM from 'react-dom/client'
import '@carbon/styles/css/styles.css'
import './styles.css'
import { MotionConfig } from 'motion/react'
import App from './App'
import { registerWebMcpTools } from './webmcp'

registerWebMcpTools()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </React.StrictMode>,
)
