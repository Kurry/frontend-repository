import { useMemo, useRef, useState } from 'react'
import { Button, Modal, Tag } from '@carbon/react'
import {
  ArrowLeft,
  Copy,
  DocumentExport,
  DocumentImport,
  Download,
  Launch,
  TrashCan,
} from '@carbon/icons-react'
import { makeLibraryDocument, techniqueById } from '../domain'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useStudioStore } from '../store'
import { copyText, downloadText } from './PreviewPanel'
import ImportModal from './ImportModal'

export default function LibraryView() {
  const [listRef] = useAutoAnimate()
  const library = useStudioStore((state) => state.library)
  const exportOpen = useStudioStore((state) => state.exportPanelOpen)
  const sortDir = useStudioStore((state) => state.librarySort || 'none')
  const setChrome = useStudioStore((state) => state.setChrome)
  const importLauncherRef = useRef(null)
  const setView = useStudioStore((state) => state.setView)
  const openLibraryEntry = useStudioStore((state) => state.openLibraryEntry)
  const deleteLibraryEntry = useStudioStore((state) => state.deleteLibraryEntry)
  const showToast = useStudioStore((state) => state.showToast)
  const [deleting, setDeleting] = useState(null)
  const document = useMemo(() => makeLibraryDocument(library), [library])
  const jsonText = useMemo(() => JSON.stringify(document, null, 2), [document])

  const sortedLibrary = useMemo(() => {
    const withOriginal = library.map((item, originalIndex) => ({ ...item, originalIndex }))
    if (sortDir === 'asc') return withOriginal.sort((a, b) => a.title.localeCompare(b.title))
    if (sortDir === 'desc') return withOriginal.sort((a, b) => b.title.localeCompare(a.title))
    return withOriginal
  }, [library, sortDir])

  const [deleteConfirm, setDeleteConfirm] = useState(null)

  function remove(index, title) {
    if (deleting !== null) return
    setDeleting(index)
    setTimeout(() => {
      deleteLibraryEntry(index)
      setDeleting(null)
      showToast('success', 'Prompt deleted', `“${title}” was removed from the library.`)
    }, 150)
  }

  async function copyExport() {
    await copyText(jsonText)
    showToast('success', 'Library JSON copied', `${library.length} entries copied from the current session.`)
  }

  return (
    <main className="library-view" id="main-content">
      <div className="library-hero">
        <div>
          <span className="eyebrow">Reusable prompt collection</span>
          <h1>Prompt library</h1>
          <p>Every saved template keeps its exact fields, references, and assembled prompt together.</p>
        </div>
        <div className="library-actions">
          <Button ref={importLauncherRef} type="button" kind="tertiary" renderIcon={DocumentImport} onClick={() => setChrome({ importModalOpen: true })}>Import JSON</Button>
          <Button type="button" kind="primary" renderIcon={DocumentExport} onClick={() => setChrome({ exportPanelOpen: !exportOpen })}>Export library</Button>
        </div>
      </div>

      <div className="library-summary">
        <div><strong>{library.length}</strong><span>saved {library.length === 1 ? 'prompt' : 'prompts'}</span></div>
        <div className="summary-rule" />
        <p>Stored in memory for this session · Reload to restore the 5 seeded templates.</p>
      </div>

      {exportOpen && (
        <section className="export-panel" aria-label="Export library">
          <div className="export-panel__heading">
            <div><span className="eyebrow">Current session artifact</span><h2>template-library.json</h2></div>
            <div className="export-actions">
              <Button type="button" kind="ghost" size="sm" renderIcon={Copy} onClick={copyExport}>Copy</Button>
              <Button type="button" kind="tertiary" size="sm" renderIcon={Download} onClick={() => downloadText('template-library.json', jsonText, 'application/json')}>Download JSON</Button>
            </div>
          </div>
          <pre tabIndex={0}>{jsonText}</pre>
        </section>
      )}

      {library.length > 0 ? (
        <section className="library-list" aria-label="Saved prompts" ref={listRef}>
          <div className="list-head">
            <button
              type="button"
              className="sort-button"
              onClick={() => setChrome({ librarySort: sortDir === 'asc' ? 'desc' : 'asc' })}
              aria-label={`Sort prompts ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
            >
              Prompt {sortDir === 'asc' ? '↓' : sortDir === 'desc' ? '↑' : ''}
            </button>
            <span>Technique</span>
            <span>Saved</span>
            <span>Actions</span>
          </div>
          {sortedLibrary.map((record) => {
            const index = record.originalIndex
            const summary = record.fields.taskDescription || record.fields.goal || `A ${techniqueById[record.technique].name} template`
            return (
              <article className={`library-row ${deleting === index ? 'is-deleting' : ''}`} key={`${record.title}-${index}`}>
                <button type="button" className="row-open" onClick={() => openLibraryEntry(index)} aria-label={`Open ${record.title}`}>
                  <span className="row-icon">{techniqueById[record.technique].short}</span>
                  <span className="row-copy"><strong>{record.title}</strong><small>{summary}</small></span>
                </button>
                <div className="row-technique"><Tag type="cool-gray">{techniqueById[record.technique].name}</Tag></div>
                <div className="row-time"><strong>Saved</strong><span>this session</span></div>
                <div className="row-actions">
                  <Button type="button" kind="ghost" size="sm" hasIconOnly renderIcon={Launch} iconDescription={`Open ${record.title}`} onClick={() => openLibraryEntry(index)} />
                  <Button type="button" kind="danger--ghost" size="sm" hasIconOnly renderIcon={TrashCan} iconDescription={`Delete ${record.title}`} onClick={() => setDeleteConfirm({ index, title: record.title })} />
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <section className="library-empty">
          <div className="empty-orbit"><span>0</span></div>
          <h2>Your library is ready for its first prompt</h2>
          <p>Build and generate a template, then save it here for future use.</p>
          <Button type="button" kind="primary" renderIcon={ArrowLeft} onClick={() => setView('forms')}>Return to forms</Button>
        </section>
      )}

      <Modal
        open={deleteConfirm !== null}
        danger
        modalHeading="Delete library prompt"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        onRequestSubmit={() => {
          if (deleteConfirm) remove(deleteConfirm.index, deleteConfirm.title)
          setDeleteConfirm(null)
        }}
        onRequestClose={() => setDeleteConfirm(null)}
        size="sm"
      >
        <p>Are you sure you want to delete this prompt? This action cannot be undone.</p>
      </Modal>

      <ImportModal launcherButtonRef={importLauncherRef} />
    </main>
  )
}
