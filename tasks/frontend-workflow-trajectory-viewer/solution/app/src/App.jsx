import React, { useEffect } from 'react'
import { useAppStore } from './store'
import { CatalogScreen, TaskScreen, IngestScreen } from './screens'
import { TrialViewer } from './viewer'
import { useWebMcp } from './webmcp'

export default function App() {
  const view = useAppStore((state) => state.view)
  const undo = useAppStore((state) => state.undo)
  const redo = useAppStore((state) => state.redo)
  const setChrome = useAppStore((state) => state.setChrome)
  useWebMcp()

  useEffect(() => {
    const onKeyDown = (event) => {
      const modifier = event.ctrlKey || event.metaKey
      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (useAppStore.getState().view === 'viewer') setChrome({ paletteOpen: true })
      }
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        event.shiftKey ? redo() : undo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [redo, setChrome, undo])

  return (
    <main className="min-h-screen bg-ink-950 text-mist-100">
      {view === 'catalog' && <CatalogScreen />}
      {view === 'task' && <TaskScreen />}
      {view === 'ingest' && <IngestScreen />}
      {view === 'viewer' && <TrialViewer />}
    </main>
  )
}

