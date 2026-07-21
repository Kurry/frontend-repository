import { useEffect, useRef, useState } from 'react'
import { Button, Tag, Tile } from '@carbon/react'
import { Checkmark, Copy, Download, Save } from '@carbon/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { markdownForPrompt, techniqueById } from '../domain'
import { useStudioStore } from '../store'

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const node = document.createElement('textarea')
  node.value = text
  node.style.position = 'fixed'
  node.style.opacity = '0'
  document.body.appendChild(node)
  node.select()
  document.execCommand('copy')
  node.remove()
}

export function downloadText(filename, text, type) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function PreviewPanel({ saveButtonRef }) {
  const technique = useStudioStore((state) => state.activeTechnique)
  const promptText = useStudioStore((state) => state.prompts[technique])
  const status = useStudioStore((state) => state.statuses[technique])
  const setChrome = useStudioStore((state) => state.setChrome)
  const showToast = useStudioStore((state) => state.showToast)
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  if (!promptText) {
    return (
      <Tile className="preview-empty" aria-label="Prompt preview">
        <div className="preview-empty__mark">⌁</div>
        <div><strong>Your assembled prompt will appear here</strong><span>Complete the required fields, then generate a deterministic prompt.</span></div>
      </Tile>
    )
  }

  async function handleCopy() {
    await copyText(promptText)
    setCopied(true)
    showToast('success', 'Prompt copied', 'The exact preview text is on your clipboard.')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1800)
  }

  const markdown = markdownForPrompt(technique, promptText)

  return (
    <Tile className="preview-panel" id="prompt-preview" aria-label="Prompt preview">
      <div className="preview-heading">
        <div>
          <span className="eyebrow">Assembled output</span>
          <h2>Prompt preview</h2>
        </div>
        <div className="preview-meta">
          <Tag type={status === 'saved' ? 'green' : 'blue'}>{status === 'saved' ? 'Saved' : 'Ready'}</Tag>
          <span>{promptText.length} characters</span>
        </div>
      </div>
      <div className="code-surface">
        <div className="code-topbar">
          <span><i /><i /><i /> {techniqueById[technique].name.toLowerCase()}.prompt</span>
          <Button
            type="button"
            kind="ghost"
            size="sm"
            onClick={handleCopy}
            aria-label={copied ? 'Prompt copied' : 'Copy assembled prompt'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={copied ? 'check' : 'copy'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.09 }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {copied ? 'Copied' : 'Copy'}
                {copied ? <Checkmark aria-hidden="true" /> : <Copy aria-hidden="true" />}
              </motion.span>
            </AnimatePresence>
          </Button>
        </div>
        <pre tabIndex={0}>{promptText}</pre>
      </div>
      <div className="preview-actions">
        <Button
          type="button"
          kind="tertiary"
          size="md"
          renderIcon={(props) => <Download {...props} aria-hidden="true" />}
          onClick={() => downloadText(`${technique}-prompt.md`, markdown, 'text/markdown')}
        >
          Download markdown
        </Button>
        <Button
          ref={saveButtonRef}
          type="button"
          kind="primary"
          size="md"
          renderIcon={(props) => <Save {...props} aria-hidden="true" />}
          onClick={() => setChrome({ saveModalOpen: true })}
        >
          Save to library
        </Button>
      </div>
    </Tile>
  )
}
