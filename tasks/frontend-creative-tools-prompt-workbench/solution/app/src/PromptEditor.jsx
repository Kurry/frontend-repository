import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { EditorState, Prec } from '@codemirror/state'
import { Decoration, EditorView, MatchDecorator, ViewPlugin, keymap, drawSelection, highlightActiveLine } from '@codemirror/view'

const placeholders = new MatchDecorator({
  regexp: /\{\{[A-Za-z0-9_]+\}\}/g,
  decoration: Decoration.mark({ class: 'cm-placeholder' }),
})

const placeholderPlugin = ViewPlugin.fromClass(class {
  constructor(view) { this.decorations = placeholders.createDeco(view) }
  update(update) { this.decorations = placeholders.updateDeco(update, this.decorations) }
}, { decorations: (instance) => instance.decorations })

export const PromptEditor = forwardRef(function PromptEditor({ value, onChange }, ref) {
  const hostRef = useRef(null)
  const viewRef = useRef(null)
  const syncingRef = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!hostRef.current) return
    const state = EditorState.create({
      doc: value,
      extensions: [
        drawSelection(),
        highlightActiveLine(),
        EditorView.lineWrapping,
        placeholderPlugin,
        EditorView.contentAttributes.of({ 'aria-label': 'Prompt editor', spellcheck: 'true' }),
        EditorView.theme({
          '&': { minHeight: '258px', height: '100%' },
          '.cm-content': { padding: '20px', fontFamily: 'IBM Plex Mono, ui-monospace, monospace', fontSize: '14px', lineHeight: '1.7', caretColor: '#2563eb' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-focused': { outline: 'none' },
          '.cm-activeLine': { backgroundColor: 'rgba(219,234,254,.35)' },
        }),
        Prec.high(keymap.of([{ key: 'Mod-z', run: () => true }, { key: 'Mod-y', run: () => true }, { key: 'Mod-Shift-z', run: () => true }])),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !syncingRef.current) onChangeRef.current(update.state.doc.toString())
        }),
      ],
    })
    const view = new EditorView({ state, parent: hostRef.current })
    viewRef.current = view
    return () => view.destroy()
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view || view.state.doc.toString() === value) return
    syncingRef.current = true
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
    syncingRef.current = false
  }, [value])

  useImperativeHandle(ref, () => ({
    focus: () => viewRef.current?.focus(),
    selection: () => {
      const selection = viewRef.current?.state.selection.main
      return selection ? { from: selection.from, to: selection.to } : { from: value.length, to: value.length }
    },
  }), [value])

  return <div ref={hostRef} className="prompt-editor" />
})

