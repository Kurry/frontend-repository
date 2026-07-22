import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { useStore } from './App.jsx'
import './index.css'
import { registerWebMCP } from './webmcp.js'

registerWebMCP(
  () => {
    const state = useStore.getState();
    return {
      schemaVersion: 'v1',
      exportedAt: state.exportedAt || new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    };
  },
  (artifact) => useStore.getState().importArtifact(artifact),
  (artifact) => useStore.getState().importArtifact(artifact)
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
