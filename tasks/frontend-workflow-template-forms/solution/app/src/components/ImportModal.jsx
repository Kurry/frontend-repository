import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileUploaderDropContainer, Modal, TextArea } from '@carbon/react'
import { z } from 'zod'
import { libraryDocumentSchema } from '../domain'
import { useStudioStore } from '../store'

const importSchema = z.object({
  documentText: z.string().min(1, 'Library JSON is required. Paste JSON or choose a file.'),
}).superRefine((value, context) => {
  try {
    const document = JSON.parse(value.documentText)
    const parsed = libraryDocumentSchema.safeParse(document)
    if (!parsed.success) {
      context.addIssue({ code: 'custom', path: ['documentText'], message: 'Library JSON does not match the Template Forms schema.' })
    }
  } catch {
    context.addIssue({ code: 'custom', path: ['documentText'], message: 'Library JSON is malformed. Check its syntax and try again.' })
  }
})

export default function ImportModal({ launcherButtonRef }) {
  const open = useStudioStore((state) => state.importModalOpen)
  const setChrome = useStudioStore((state) => state.setChrome)
  const replaceLibrary = useStudioStore((state) => state.replaceLibrary)
  const showToast = useStudioStore((state) => state.showToast)
  const [submitError, setSubmitError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(importSchema),
    mode: 'onChange',
    defaultValues: { documentText: '' },
  })

  useEffect(() => {
    if (!open) {
      reset({ documentText: '' })
      setSubmitError('')
    }
  }, [open, reset])

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      close()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function close() {
    setChrome({ importModalOpen: false })
    requestAnimationFrame(() => launcherButtonRef?.current?.focus())
  }

  function confirm({ documentText }) {
    try {
      const document = libraryDocumentSchema.parse(JSON.parse(documentText))
      replaceLibrary(document.entries)
      close()
      showToast('success', 'Library imported', `${document.entries.length} prompts restored from the validated document.`)
    } catch {
      const message = 'Library JSON does not match the Template Forms schema.'
      setSubmitError(message)
      setError('documentText', { type: 'manual', message })
      showToast('error', 'Import failed', message)
    }
  }

  async function attemptImport() {
    const valid = await trigger()
    if (!valid) {
      const fieldError = importSchema.safeParse({ documentText: getValues('documentText') }).error?.issues.find((issue) => issue.path[0] === 'documentText')
      const message = fieldError?.message
        || (getValues('documentText')?.trim()
          ? 'Library JSON does not match the Template Forms schema.'
          : 'Library JSON is required. Paste JSON or choose a file.')
      setSubmitError(message)
      setError('documentText', { type: 'manual', message })
      showToast('error', 'Import rejected', message)
      return
    }
    handleSubmit(confirm)()
  }

  async function addFile(_event, { addedFiles }) {
    const file = addedFiles?.[0]
    if (!file) return
    const text = await file.text()
    setValue('documentText', text, { shouldDirty: true, shouldValidate: true })
    await trigger('documentText')
  }

  if (!open) return null

  return (
    <Modal
      open
      modalHeading="Import library JSON"
      modalLabel="Validated replacement"
      primaryButtonText="Replace library"
      secondaryButtonText="Cancel"
      onRequestSubmit={attemptImport}
      onRequestClose={close}
      onSecondarySubmit={close}
      size="md"
      className="scale-modal"
      selectorPrimaryFocus="#import-document-text"
    >
      <p className="modal-copy">Importing a conforming Template Forms document replaces the current in-memory library. Invalid files leave it unchanged.</p>
      <FileUploaderDropContainer
        id="library-json-file"
        accept={['application/json', '.json']}
        labelText="Choose template-library.json"
        multiple={false}
        onAddFiles={addFile}
      />
      <div className="import-divider"><span>or paste JSON</span></div>
      <TextArea
        id="import-document-text"
        data-modal-primary-focus
        labelText="Library document"
        rows={10}
        placeholder={'{\n  "schemaVersion": 1,\n  "product": "Template Forms",\n  ...\n}'}
        invalid={Boolean(errors.documentText || submitError)}
        invalidText={errors.documentText?.message || submitError}
        {...register('documentText')}
      />
    </Modal>
  )
}
