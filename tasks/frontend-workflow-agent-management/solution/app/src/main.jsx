import React from 'react'
import ReactDOM from 'react-dom/client'
import { Theme } from '@carbon/react'
import App from './App'
import './carbon.scss'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Theme theme="g100">
      <App />
    </Theme>
  </React.StrictMode>,
)
