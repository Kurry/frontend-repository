import React, { useReducer, useEffect } from 'react'
import { flushSync } from 'react-dom'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import App from './App'
import { registerUiFlush } from './flushBridge'
import './styles.css'

function Bootstrap() {
  const [, rerender] = useReducer((count) => count + 1, 0)
  useEffect(() => {
    registerUiFlush(() => flushSync(() => rerender()))
    return () => registerUiFlush(null)
  }, [])
  return (
    <ChakraProvider value={defaultSystem}>
      <App />
    </ChakraProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<Bootstrap />)
