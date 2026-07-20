import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useMemo, useState, useRef } from 'react'
import { Button, Tag, Toggle, Modal } from '@carbon/react'
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
import { useStudioStore } from '../store'
import { copyText, downloadText } from './PreviewPanel'

export default function LibraryView({ importLauncherRef }) {
  const library = useStudioStore((state) => state.library)
  const exportOpen = useStudioStore((state) => state.exportPanelOpen)
  const setChrome = useStudioStore((state) => state.setChrome)
  const setView = useStudioStore((state) => state.setView)
  const openLibraryEntry = useStudioStore((state) => state.openLibraryEntry)
  const deleteLibraryEntry = useStudioStore((state) => state.deleteLibraryEntry)
  const showToast = useStudioStore((state) => state.showToast)
  const [deleting, setDeleting] = useState(null)
  const sortOrder = useStudioStore((state) => state.sortOrder)
  const toggleSortOrder = useStudioStore((state) => state.toggleSortOrder)
  const document = useMemo(() => makeLibraryDocument(library), [library])
  const jsonText = useMemo(() => JSON.stringify(document, null, 2), [document])
  const [parent] = useAutoAnimate()
  const [confirmDelete, setConfirmDelete] = useState(null)
  const deleteLauncher = useRef(null)
  const deleteInFlight = useRef(false)
  const libraryActionFallback = useRef(null)
  const rowOpenButtons = useRef(new Map())

  const sortedLibrary = useMemo(() => {
    return [...library].map((item, originalIndex) => ({ ...item, originalIndex, sourceRecord: item })).sort((a, b) => {
      return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
    })
  }, [library, sortOrder])

  function confirmRemove(record, title, event) {
    deleteLauncher.current = event.currentTarget
    deleteInFlight.current = false
    setConfirmDelete({ record, title })
  }

  function commitRemove() {
    if (!confirmDelete || deleteInFlight.current) return
    deleteInFlight.current = true
    const { record, title } = confirmDelete
    const index = library.indexOf(record)
    if (index < 0) {
      setConfirmDelete(null)
      showToast('error', 'Prompt not deleted', 'The library changed before deletion could be confirmed.')
      requestAnimationFrame(() => {
        if (deleteLauncher.current?.isConnected) deleteLauncher.current.focus()
        else libraryActionFallback.current?.focus()
      })
      return
    }
    const visibleIndex = sortedLibrary.findIndex((item) => item.sourceRecord === record)
    const remainingRows = sortedLibrary.filter((item) => item.sourceRecord !== record)
    const successor = remainingRows[Math.min(visibleIndex, remainingRows.length - 1)]?.sourceRecord
    setDeleting(index)
    deleteLibraryEntry(index)
    setDeleting(null)
    setConfirmDelete(null)
    showToast('success', 'Prompt deleted', `“${title}” was removed from the library.`)
    requestAnimationFrame(() => {
      if (successor) rowOpenButtons.current.get(successor)?.focus()
      else libraryActionFallback.current?.focus()
    })
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
          <Button ref={importLauncherRef || libraryActionFallback} type="button" kind="tertiary" renderIcon={(props) => <DocumentImport {...props} aria-hidden="true" />} onClick={() => setChrome({ importModalOpen: true })}>Import JSON</Button>
          <Button type="button" kind="primary" renderIcon={(props) => <DocumentExport {...props} aria-hidden="true" />} onClick={() => setChrome({ exportPanelOpen: !exportOpen })}>Export library</Button>
        </div>
      </div>

      <div className="library-summary">
        <div><strong>{library.length}</strong><span>saved {library.length === 1 ? 'prompt' : 'prompts'}</span></div>
        <div className="summary-rule" />
        <p>Stored in memory for this session · Reload to restore the 5 seeded templates.</p>
        <div className="summary-rule" />
        <Toggle size="sm" id="sort-toggle" labelA="Ascending" labelB="Descending" toggled={sortOrder === 'desc'} onToggle={toggleSortOrder} />
      </div>

      {exportOpen && (
        <section className="export-panel" aria-label="Export library">
          <div className="export-panel__heading">
            <div><span className="eyebrow">Current session artifact</span><h2>template-library.json</h2></div>
            <div className="export-actions">
              <Button type="button" kind="ghost" size="sm" renderIcon={(props) => <Copy {...props} aria-hidden="true" />} onClick={copyExport}>Copy</Button>
              <Button type="button" kind="tertiary" size="sm" renderIcon={(props) => <Download {...props} aria-hidden="true" />} onClick={() => downloadText('template-library.json', jsonText, 'application/json')}>Download JSON</Button>
            </div>
          </div>
          <pre tabIndex={0}>{jsonText}</pre>
        </section>
      )}

      {sortedLibrary.length > 0 ? (
        <section className="library-list" aria-label="Saved prompts" ref={parent}>
          <div className="list-head"><span>Prompt</span><span>Technique</span><span>Saved</span><span>Actions</span></div>
          {sortedLibrary.map((record) => {
            const index = record.originalIndex
            const summary = record.fields.taskDescription || record.fields.goal || `A ${techniqueById[record.technique].name} template`
            return (
              <article className={`library-row ${deleting === index ? 'is-deleting' : ''}`} key={`${record.title}-${index}`}>
                <button
                  ref={(node) => {
                    if (node) rowOpenButtons.current.set(record.sourceRecord, node)
                    else rowOpenButtons.current.delete(record.sourceRecord)
                  }}
                  type="button"
                  className="row-open"
                  onClick={() => openLibraryEntry(index)}
                  aria-label={`Open ${record.title}`}
                >
                  <span className="row-icon">{techniqueById[record.technique].short}</span>
                  <span className="row-copy"><strong>{record.title}</strong><small>{summary}</small></span>
                </button>
                <div className="row-technique"><Tag type="cool-gray">{techniqueById[record.technique].name}</Tag></div>
                <div className="row-time"><strong>Saved</strong><span>this session</span></div>
                <div className="row-actions">
                  <Button type="button" kind="ghost" size="sm" hasIconOnly renderIcon={(props) => <Launch {...props} aria-hidden="true" />} iconDescription={`Open ${record.title}`} onClick={() => openLibraryEntry(index)} />
                  <Button type="button" kind="danger--ghost" size="sm" hasIconOnly renderIcon={(props) => <TrashCan {...props} aria-hidden="true" />} iconDescription={`Delete ${record.title}`} onClick={(e) => confirmRemove(record.sourceRecord, record.title, e)} />
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
          <Button type="button" kind="primary" renderIcon={(props) => <ArrowLeft {...props} aria-hidden="true" />} onClick={() => setView('forms')}>Return to forms</Button>
        </section>
      )}

      <Modal
        open={Boolean(confirmDelete)}
        danger
        modalHeading="Delete prompt"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        onRequestSubmit={commitRemove}
        onRequestClose={() => {
          deleteInFlight.current = false
          setConfirmDelete(null)
          requestAnimationFrame(() => deleteLauncher.current?.focus())
        }}
        focusTrap={true}
      >
        <p className="modal-copy">Are you sure you want to delete this prompt? This action cannot be undone.</p>
      </Modal>
    </main>
  )
}
